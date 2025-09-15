import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправляем триггер для автоматического назначения кредитов...')

    // Сначала проверим, существует ли функция
    const { data: functions, error: checkError } = await supabaseClient
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'handle_new_user')

    if (checkError) {
      console.log('❌ Ошибка проверки функции:', checkError)
    } else {
      console.log('📋 Найденные функции handle_new_user:', functions)
    }

    // Попробуем выполнить SQL через rpc
    try {
      const { data, error } = await supabaseClient.rpc('exec', {
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

      if (error) {
        console.error('❌ Ошибка создания функции:', error)
        return NextResponse.json({ error: 'Не удалось создать функцию', details: error.message }, { status: 500 })
      }

      console.log('✅ Функция обновлена успешно')

      // Теперь обновляем триггер
      const { error: triggerError } = await supabaseClient.rpc('exec', {
        sql: `
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
        `
      })

      if (triggerError) {
        console.error('❌ Ошибка обновления триггера:', triggerError)
        return NextResponse.json({ error: 'Не удалось обновить триггер', details: triggerError.message }, { status: 500 })
      }

      console.log('✅ Триггер обновлен успешно')

      return NextResponse.json({
        success: true,
        message: 'Триггер исправлен успешно. Новые пользователи будут получать 5 кредитов автоматически.'
      })

    } catch (rpcError) {
      console.error('❌ Ошибка RPC:', rpcError)
      
      // Попробуем альтернативный подход - создадим API для ручного назначения кредитов
      return NextResponse.json({
        success: false,
        message: 'Не удалось обновить триггер через RPC. Используем альтернативный подход.',
        alternative: 'Создайте API для ручного назначения кредитов новым пользователям'
      })
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
