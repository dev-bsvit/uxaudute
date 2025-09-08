import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Глобальный синглтон через window объект (только для клиентской стороны)
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient
    __supabaseAdminClient?: SupabaseClient
  }
}

// Клиент для клиентской стороны (с RLS) - глобальный синглтон
export const supabase = (() => {
  // На сервере всегда создаем новый экземпляр
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  
  // На клиенте используем глобальный синглтон
  if (!window.__supabaseClient) {
    window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  return window.__supabaseClient
})()

// Серверный клиент для API routes (с service role key или анонимным ключом) - синглтон
export const supabaseAdmin = (() => {
  // На клиенте используем глобальный синглтон
  if (typeof window !== 'undefined') {
    if (!window.__supabaseAdminClient) {
      window.__supabaseAdminClient = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
            }
          }
        }
      )
    }
    return window.__supabaseAdminClient
  }
  
  // На сервере создаем новый экземпляр
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
        }
      }
    }
  )
})()
