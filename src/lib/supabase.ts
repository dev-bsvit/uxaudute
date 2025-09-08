import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Синглтон для клиентского клиента (избегаем множественных экземпляров)
let supabaseClient: SupabaseClient | null = null
let supabaseAdminClient: SupabaseClient | null = null

// Клиент для клиентской стороны (с RLS) - синглтон
export const supabase = (() => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
})()

// Серверный клиент для API routes (с service role key или анонимным ключом) - синглтон
export const supabaseAdmin = (() => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
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
  return supabaseAdminClient
})()
