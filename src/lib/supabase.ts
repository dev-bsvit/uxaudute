import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Глобальная переменная для хранения единственного экземпляра клиента
let supabaseInstance: SupabaseClient | null = null

// Клиент для клиентской стороны (с RLS) - строгий синглтон
export const supabase = (() => {
  // На сервере всегда создаем новый экземпляр
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  
  // На клиенте используем строгий синглтон
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ux-audit-auth' // Уникальный ключ для нашего приложения
      }
    })
    
    // Добавляем в window только для отладки
    if (typeof window !== 'undefined') {
      (window as any).__supabaseClient = supabaseInstance
    }
  }
  return supabaseInstance
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
