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
  auditType: 'research' | 'ab_test' | 'business' | 'hypotheses',
  customCredits?: number // Опциональный параметр для кастомного количества кредитов
): Promise<CreditsCheckResult> {
  try {
    console.log('🔍 checkCreditsForAudit: userId=', userId, 'auditType=', auditType, 'customCredits=', customCredits)

    let requiredCredits: number

    if (customCredits !== undefined) {
      // Используем кастомное количество кредитов
      requiredCredits = customCredits
      console.log('🔍 Используем кастомное количество кредитов:', requiredCredits)
    } else {
      // Получаем стоимость аудита из таблицы
      console.log('🔍 Получаем стоимость аудита из audit_credits...')
      const { data: auditCost, error: costError } = await supabaseClient
        .from('audit_credits')
        .select('credits_cost')
        .eq('audit_type', auditType)
        .eq('is_active', true)
        .single()

      console.log('🔍 Результат запроса стоимости:', { auditCost, costError })

      if (costError || !auditCost) {
        console.error('❌ Error fetching audit cost:', costError)
        return {
          canProceed: false,
          isTestAccount: false,
          currentBalance: 0,
          requiredCredits: 0,
          message: 'Failed to get audit cost'
        }
      }

      requiredCredits = auditCost.credits_cost
      console.log('🔍 Требуется кредитов:', requiredCredits)
    }

    // Проверяем, является ли пользователь тестовым
    console.log('🔍 Проверяем профиль пользователя...')
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_test_account')
      .eq('id', userId)
      .single()

    console.log('🔍 Результат запроса профиля:', { profile, profileError })

    // Если тестовый аккаунт, разрешаем без списания
    if (profile?.is_test_account) {
      console.log('✅ Тестовый аккаунт - разрешаем без списания')
      return {
        canProceed: true,
        isTestAccount: true,
        currentBalance: 0,
        requiredCredits,
        message: 'Test account - no credits required'
      }
    }

    // Проверяем возможность списания
    console.log('🔍 Проверяем возможность списания через RPC...')
    const { data: canDeduct, error } = await supabaseClient
      .rpc('can_deduct_credits', {
        user_uuid: userId,
        amount: requiredCredits
      })

    console.log('🔍 Результат RPC can_deduct_credits:', { canDeduct, error })

    if (error) {
      console.error('❌ Error checking credits:', error)
      return {
        canProceed: false,
        isTestAccount: false,
        currentBalance: 0,
        requiredCredits,
        message: 'Failed to check credits'
      }
    }

    // Получаем текущий баланс
    console.log('🔍 Получаем текущий баланс...')
    const { data: balance, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    console.log('🔍 Результат запроса баланса:', { balance, balanceError })

    const result = {
      canProceed: canDeduct,
      isTestAccount: false,
      currentBalance: balance?.balance || 0,
      requiredCredits,
      message: canDeduct ? 'Credits available' : 'Insufficient credits'
    }

    console.log('🔍 Финальный результат checkCreditsForAudit:', result)
    return result

  } catch (error) {
    console.error('❌ Error in checkCreditsForAudit:', error)
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
  description: string,
  customCredits?: number // Опциональный параметр для кастомного количества кредитов
): Promise<CreditsDeductResult> {
  try {
    let requiredCredits: number

    if (customCredits !== undefined) {
      // Используем кастомное количество кредитов
      requiredCredits = customCredits
      console.log('🔍 Списываем кастомное количество кредитов:', requiredCredits)
    } else {
      // Получаем стоимость аудита из таблицы
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

      requiredCredits = auditCost.credits_cost
    }

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
    console.log('🔍 Вызываем RPC deduct_credits с параметрами:', {
      user_uuid: userId,
      amount: requiredCredits,
      source: 'audit',
      description: description,
      related_audit_id: auditId
    })

    const { data: deducted, error } = await supabaseClient
      .rpc('deduct_credits', {
        user_uuid: userId,
        amount: requiredCredits,
        source: 'audit',
        description: description,
        related_audit_id: auditId
      })

    console.log('🔍 Результат RPC deduct_credits:', { deducted, error })

    if (error) {
      console.error('❌ Error deducting credits:', error)
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: `Failed to deduct credits: ${error.message || 'Unknown error'}`
      }
    }

    if (!deducted) {
      console.error('❌ RPC deduct_credits вернула false (недостаточно кредитов)')
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: 'Insufficient credits (RPC returned false)'
      }
    }

    console.log('✅ Кредиты успешно списаны через RPC')

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
 * Безопасное списание кредитов с проверкой флага credits_deducted
 * Предотвращает двойное списание
 */
export async function safeDeductCreditsForAudit(
  userId: string,
  auditType: 'research' | 'ab_test' | 'business' | 'hypotheses',
  auditId: string,
  description: string,
  customCredits?: number
): Promise<CreditsDeductResult> {
  try {
    console.log('🔒 safeDeductCreditsForAudit: начало', { userId, auditId, auditType })

    // 1. Проверяем существование аудита и флаг credits_deducted
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select('id, status, credits_deducted, credits_amount')
      .eq('id', auditId)
      .eq('user_id', userId)
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден:', auditError)
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: 'Audit not found or access denied'
      }
    }

    // 2. Проверяем, не были ли уже списаны кредиты
    if (audit.credits_deducted) {
      console.log('⚠️ Кредиты уже были списаны для этого аудита')
      return {
        success: true,
        deducted: false,
        isTestAccount: false,
        message: 'Credits already deducted for this audit',
        newBalance: await getUserBalance(userId)
      }
    }

    // 3. Проверяем статус аудита (списываем только за completed)
    if (audit.status !== 'completed') {
      console.log('❌ Аудит не завершен, статус:', audit.status)
      return {
        success: false,
        deducted: false,
        isTestAccount: false,
        message: `Cannot deduct credits for audit with status: ${audit.status}`
      }
    }

    console.log('✅ Аудит прошел валидацию, списываем кредиты...')

    // 4. Списываем кредиты используя существующую функцию
    const deductResult = await deductCreditsForAudit(
      userId,
      auditType,
      auditId,
      description,
      customCredits
    )

    if (!deductResult.success) {
      console.error('❌ Не удалось списать кредиты:', deductResult.message)
      return deductResult
    }

    console.log('✅ Кредиты списаны, обновляем флаг в audits...')

    // 5. Обновляем флаг credits_deducted в таблице audits
    const creditsAmount = customCredits || deductResult.newBalance || 2
    const { error: updateError } = await supabaseClient
      .from('audits')
      .update({
        credits_deducted: true,
        credits_amount: creditsAmount,
        credits_deducted_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('⚠️ Не удалось обновить флаг credits_deducted:', updateError)
      // Кредиты уже списаны, поэтому возвращаем success=true
      // но предупреждаем об ошибке обновления флага
    } else {
      console.log('✅ Флаг credits_deducted обновлен успешно')
    }

    return {
      ...deductResult,
      success: true,
      deducted: true
    }

  } catch (error) {
    console.error('❌ Error in safeDeductCreditsForAudit:', error)
    return {
      success: false,
      deducted: false,
      isTestAccount: false,
      message: 'Internal error during credits deduction'
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
