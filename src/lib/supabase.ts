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
    window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return window.__supabaseClient
})()

// Серверный клиент для API routes (с service role key или анонимным ключом)
export const supabaseAdmin = createClient(
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
