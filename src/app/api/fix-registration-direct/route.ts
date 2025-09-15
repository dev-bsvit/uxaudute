import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Применяем исправление регистрации пользователей...')

    // Обновляем функцию handle_new_user для создания начального баланса
    const updateFunctionSQL = `
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

    // Выполняем обновление функции
    const { error: functionError } = await supabaseClient.rpc('exec', { 
      sql: updateFunctionSQL 
    })

    if (functionError) {
      console.error('Ошибка обновления функции:', functionError)
      return NextResponse.json({ 
        error: 'Ошибка обновления функции', 
        details: functionError.message 
      }, { status: 500 })
    }

    // Пересоздаем trigger
    const recreateTriggerSQL = `
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

    const { error: triggerError } = await supabaseClient.rpc('exec', { 
      sql: recreateTriggerSQL 
    })

    if (triggerError) {
      console.error('Ошибка пересоздания trigger:', triggerError)
      return NextResponse.json({ 
        error: 'Ошибка пересоздания trigger', 
        details: triggerError.message 
      }, { status: 500 })
    }

    console.log('✅ Исправление регистрации применено успешно')

    return NextResponse.json({ 
      success: true, 
      message: 'Исправление регистрации пользователей применено успешно. Теперь новые пользователи будут получать 5 кредитов автоматически.'
    })

  } catch (error) {
    console.error('Error in POST /api/fix-registration-direct:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

