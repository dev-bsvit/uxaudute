/**
 * =====================================================
 * ЛОГІКА РОБОТИ З ПІДПИСКАМИ
 * =====================================================
 * Перевірка активних підписок та денних лімітів
 */

import { createClient } from '@supabase/supabase-js'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SubscriptionCheckResult {
  hasSubscription: boolean
  canProceed: boolean
  dailyLimit?: number
  usedToday?: number
  remaining?: number
  subscriptionType?: string
  message: string
}

/**
 * Перевірка активної підписки та денного ліміту
 */
export async function checkSubscriptionAccess(
  userId: string,
  auditType: string
): Promise<SubscriptionCheckResult> {
  try {
    console.log('🔍 checkSubscriptionAccess:', { userId, auditType })

    // Викликаємо RPC функцію для перевірки денного ліміту
    const { data, error } = await supabaseClient
      .rpc('check_daily_limit', {
        user_uuid: userId
      })

    if (error) {
      console.error('❌ Error checking subscription:', error)
      return {
        hasSubscription: false,
        canProceed: false,
        message: 'Error checking subscription'
      }
    }

    console.log('✅ Subscription check result:', data)

    return {
      hasSubscription: data.has_subscription,
      canProceed: data.can_proceed,
      dailyLimit: data.daily_limit,
      usedToday: data.used_today,
      remaining: data.remaining,
      subscriptionType: data.subscription_type,
      message: data.message
    }
  } catch (error) {
    console.error('❌ Error in checkSubscriptionAccess:', error)
    return {
      hasSubscription: false,
      canProceed: false,
      message: 'Internal error'
    }
  }
}

/**
 * Інкремент використання підписки (після успішного аудиту)
 */
export async function incrementSubscriptionUsage(
  userId: string,
  auditType: string
): Promise<boolean> {
  try {
    console.log('📈 incrementSubscriptionUsage:', { userId, auditType })

    const { data, error } = await supabaseClient
      .rpc('increment_subscription_usage', {
        user_uuid: userId,
        audit_type_param: auditType
      })

    if (error) {
      console.error('❌ Error incrementing usage:', error)
      return false
    }

    console.log('✅ Usage incremented:', data)
    return data === true
  } catch (error) {
    console.error('❌ Error in incrementSubscriptionUsage:', error)
    return false
  }
}

/**
 * Отримати інформацію про підписку користувача
 */
export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserSubscription:', error)
    return null
  }
}

/**
 * Отримати використання підписки за сьогодні
 */
export async function getTodayUsage(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseClient
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching usage:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getTodayUsage:', error)
    return null
  }
}
