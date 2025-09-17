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

    // Обновляем функцию handle_new_user
    const { error: functionError } = await supabaseClient
      .from('_sql')
      .select('*')
      .eq('query', `
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
      `)

    if (functionError) {
      console.error('Ошибка обновления функции:', functionError)
      // Попробуем через RPC
      try {
        const { error: rpcError } = await supabaseClient.rpc('exec', { 
          sql: `
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
              INSERT INTO public.profiles (id, email, full_name)
              VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
              
              INSERT INTO public.user_balances (user_id, balance, grace_limit_used)
              VALUES (NEW.id, 5, false);
              
              INSERT INTO public.transactions (
                user_id, type, amount, balance_after, source, description
              ) VALUES (
                NEW.id, 'credit', 5, 5, 'welcome', 'Добро пожаловать! Начальный баланс 5 кредитов'
              );
              
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          ` 
        })
        
        if (rpcError) {
          throw rpcError
        }
      } catch (rpcError) {
        console.error('Ошибка RPC:', rpcError)
        return NextResponse.json({ 
          error: 'Не удалось обновить функцию', 
          details: rpcError instanceof Error ? rpcError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    console.log('✅ Исправление регистрации применено успешно')

    return NextResponse.json({ 
      success: true, 
      message: 'Исправление регистрации пользователей применено успешно. Теперь новые пользователи будут получать 5 кредитов автоматически.'
    })

  } catch (error) {
    console.error('Error in POST /api/fix-registration-simple:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
