import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Применяем миграцию регистрации пользователей...')

    // Обновляем функцию handle_new_user
    const { error: functionError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Создаем профиль пользователя
          INSERT INTO public.profiles (id, email, full_name)
          VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
          
          -- Создаем начальный баланс с 5 кредитами
          INSERT INTO public.user_balances (user_id, balance, grace_limit_used)
          VALUES (NEW.id, 5, false);
          
          -- Создаем транзакцию для начального баланса
          INSERT INTO public.transactions (
            user_id,
            type,
            amount,
            balance_after,
            source,
            description
          ) VALUES (
            NEW.id,
            'credit',
            5,
            5,
            'welcome',
            'Добро пожаловать! Начальный баланс 5 кредитов'
          );
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (functionError) {
      console.error('❌ Ошибка обновления функции:', functionError)
      return NextResponse.json({ error: 'Не удалось обновить функцию', details: functionError.message }, { status: 500 })
    }

    // Пересоздаем триггер
    const { error: triggerError } = await supabaseClient.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Удаляем старый trigger если существует
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          
          -- Создаем новый trigger
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
            
          RAISE NOTICE 'Trigger on_auth_user_created updated successfully';
        END $$;
      `
    })

    if (triggerError) {
      console.error('❌ Ошибка обновления триггера:', triggerError)
      return NextResponse.json({ error: 'Не удалось обновить триггер', details: triggerError.message }, { status: 500 })
    }

    console.log('✅ Миграция регистрации применена успешно')

    return NextResponse.json({
      success: true,
      message: 'Миграция регистрации применена успешно. Новые пользователи будут получать 5 кредитов автоматически.'
    })

  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

