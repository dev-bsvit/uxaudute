import { createClient } from '@supabase/supabase-js'

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CreditsCheckResult {
  canProceed: boolean
  isTestAccount: boolean
  currentBalance: number
  requiredCredits: number
  message?: string
}

export interface CreditsDeductResult {
  success: boolean
  deducted: boolean
  isTestAccount: boolean
  transactionId?: string
  newBalance?: number
  message?: string
}

/**
 * Проверяет возможность списания кредитов для аудита
 */
export async function checkCreditsForAudit(
  userId: string,
  auditType: 'research' | 'ab_test' | 'business' | 'hypotheses'
): Promise<CreditsCheckResult> {
  try {
    // Получаем стоимость аудита
    const { data: auditCost, error: costError } = await supabaseClient
      .from('audit_credits')
      .select('credits_cost')
      .eq('audit_type', auditType)
      .eq('is_active', true)
      .single()

    if (costError || !auditCost) {
      console.error('Error fetching audit cost:', costError)
      return {
        canProceed: false,
        isTestAccount: false,
        currentBalance: 0,
        requiredCredits: 0,
        message: 'Failed to get audit cost'
      }
    }

    const requiredCredits = auditCost.credits_cost

    // Проверяем, является ли пользователь тестовым
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_test_account')
      .eq('id', userId)
      .single()

    // Если тестовый аккаунт, разрешаем без списания
    if (profile?.is_test_account) {
      return {
        canProceed: true,
        isTestAccount: true,
        currentBalance: 0,
        requiredCredits,
        message: 'Test account - no credits required'
      }
    }

    // Проверяем возможность списания
    const { data: canDeduct, error } = await supabaseClient
      .rpc('can_deduct_credits', {
        user_uuid: userId,
        amount: requiredCredits
      })

    if (error) {
      console.error('Error checking credits:', error)
      return {
        canProceed: false,
        isTestAccount: false,
        currentBalance: 0,
        requiredCredits,
        message: 'Failed to check credits'
      }
    }

    // Получаем текущий баланс
    const { data: balance } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    return {
      canProceed: canDeduct,
      isTestAccount: false,
      currentBalance: balance?.balance || 0,
      requiredCredits,
      message: canDeduct ? 'Credits available' : 'Insufficient credits'
    }

  } catch (error) {
    console.error('Error in checkCreditsForAudit:', error)
    return {
      canProceed: false,
      isTestAccount: false,
      currentBalance: 0,
      requiredCredits: 0,
      message: 'Internal error'
    }
  }
}

/**
 * Списывает кредиты за аудит
 */
export async function deductCreditsForAudit(
  userId: string,
  auditType: 'research' | 'ab_test' | 'business' | 'hypotheses',
  auditId: string,
  description: string
): Promise<CreditsDeductResult> {
  try {
    // Получаем стоимость аудита
    const { data: auditCost, error: costError } = await supabaseClient
      .from('audit_credits')
      .select('credits_cost')
      .eq('audit_type', auditType)
      .eq('is_active', true)
      .single()

    if (costError || !auditCost) {
      console.error('Error fetching audit cost:', costError)
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: 'Failed to get audit cost'
      }
    }

    const requiredCredits = auditCost.credits_cost

    // Проверяем, является ли пользователь тестовым
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_test_account')
      .eq('id', userId)
      .single()

    // Если тестовый аккаунт, создаем запись "zero-cost test"
    if (profile?.is_test_account) {
      const { data: transaction, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'debit',
          amount: -requiredCredits,
          balance_after: 0,
          source: 'trial',
          description: `Test account: ${description}`,
          related_audit_id: auditId,
          metadata: { is_test_transaction: true, audit_type: auditType }
        })
        .select()
        .single()

      if (transactionError) {
        console.error('Error creating test transaction:', transactionError)
        return {
          success: false,
          deducted: false,
          isTestAccount: true,
          message: 'Failed to create test transaction'
        }
      }

      return {
        success: true,
        deducted: true,
        isTestAccount: true,
        transactionId: transaction.id,
        newBalance: 0,
        message: 'Test account - no credits deducted'
      }
    }

    // Используем функцию из базы данных для атомарного списания
    const { data: deducted, error } = await supabaseClient
      .rpc('deduct_credits', {
        user_uuid: userId,
        amount: requiredCredits,
        source: 'audit',
        description: description,
        related_audit_id: auditId
      })

    if (error) {
      console.error('Error deducting credits:', error)
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: 'Failed to deduct credits'
      }
    }

    if (!deducted) {
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: 'Insufficient credits'
      }
    }

    // Получаем обновленный баланс
    const { data: balance } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    return {
      success: true,
      deducted: true,
      isTestAccount: false,
      newBalance: balance?.balance || 0,
      message: 'Credits deducted successfully'
    }

  } catch (error) {
    console.error('Error in deductCreditsForAudit:', error)
    return {
      success: false,
      deducted: false,
      isTestAccount: false,
      message: 'Internal error'
    }
  }
}

/**
 * Получает баланс пользователя
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const { data: balance, error } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching balance:', error)
      return 0
    }

    return balance?.balance || 0
  } catch (error) {
    console.error('Error in getUserBalance:', error)
    return 0
  }
}
