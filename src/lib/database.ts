import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']
type Project = Tables['projects']['Row']
type Audit = Tables['audits']['Row']
type AuditInsert = Tables['audits']['Insert']
type AuditHistory = Tables['audit_history']['Insert']

// Projects functions
export async function createProject(name: string, description?: string, context?: string, targetAudience?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    console.log('Creating project for user:', user.id, user.email)

    // Убедимся, что пользователь существует в profiles
    await ensureUserProfile(user)

    console.log('User profile ensured, creating project:', { name, description, context, targetAudience })

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        context,
        target_audience: targetAudience
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase project creation error:', error)
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
    }

    console.log('Project created successfully:', data)
    return data
  } catch (error) {
    console.error('createProject error:', error)
    throw error
  }
}

// Функция для создания профиля пользователя если его нет
async function ensureUserProfile(user: any) {
  try {
    console.log('Checking user profile for:', user.id, user.email)
    
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user profile:', selectError)
      throw selectError
    }

    if (!existingProfile) {
      console.log('Creating new user profile...')
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      }
      console.log('Profile data:', profileData)

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (insertError && insertError.code !== '23505') { // Игнорируем ошибку дублирования
        console.error('Error creating user profile:', insertError)
        throw new Error(`Profile creation failed: ${insertError.message}`)
      }
      
      console.log('User profile created successfully')
    } else {
      console.log('User profile already exists')
    }
  } catch (error) {
    console.error('ensureUserProfile error:', error)
    throw error
  }
}

export async function getUserProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Убедимся, что пользователь существует в profiles
  await ensureUserProfile(user)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function updateProjectContext(projectId: string, context: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ context })
    .eq('id', projectId)

  if (error) {
    console.error('Error updating project context:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function updateProjectTargetAudience(projectId: string, targetAudience: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ target_audience: targetAudience })
    .eq('id', projectId)

  if (error) {
    console.error('Error updating project target audience:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function getProjectAudits(projectId: string): Promise<Audit[]> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting project audits:', error)
    return []
  }
  return data || []
}

// Оптимизированная функция для получения только скриншотов (для превью карточек)
export async function getProjectAuditsForPreview(projectId: string): Promise<{count: number, audits: Array<{id: string, input_data: Record<string, unknown> | null}>}> {
  const [countResult, auditsResult] = await Promise.all([
    supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('audits')
      .select('id, input_data')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10) // Берём 10 последних, чтобы найти 4 со скриншотами
  ])

  if (countResult.error) {
    console.error('Error getting project audits count:', countResult.error)
    return { count: 0, audits: [] }
  }

  if (auditsResult.error) {
    console.error('Error getting project audits for preview:', auditsResult.error)
    return { count: countResult.count || 0, audits: [] }
  }

  return {
    count: countResult.count || 0,
    audits: (auditsResult.data || []) as Array<{id: string, input_data: Record<string, unknown> | null}>
  }
}

// Получить последние аудиты пользователя
export async function getUserRecentAudits(limit: number = 4): Promise<Audit[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting recent audits:', error)
    return []
  }

  return data || []
}

// Audits functions
export async function createAudit(
  projectId: string,
  name: string,
  type: AuditInsert['type'],
  inputData: Record<string, unknown>,
  context?: string,
  language?: string
): Promise<Audit> {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Пользователь не аутентифицирован')
  }

  const { data, error } = await supabase
    .from('audits')
    .insert({
      project_id: projectId,
      user_id: user.id,
      name,
      type,
      status: 'in_progress',
      input_data: inputData,
      context: context || null,
      language: language || 'en'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAuditResult(
  auditId: string,
  resultData: Record<string, unknown>,
  confidence?: number
): Promise<Audit> {
  const { data, error } = await supabase
    .from('audits')
    .update({
      result_data: resultData,
      confidence,
      status: 'completed'
    })
    .eq('id', auditId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Annotation functions
export async function saveAnnotations(
  auditId: string,
  annotations: Record<string, unknown>
): Promise<void> {
  // Сначала проверяем права доступа через getAudit
  const audit = await getAudit(auditId)
  if (!audit) {
    throw new Error('Audit not found or access denied')
  }

  const { error } = await supabase
    .from('audits')
    .update({
      annotations,
      updated_at: new Date().toISOString()
    })
    .eq('id', auditId)

  if (error) throw error
}

export async function getAnnotations(auditId: string): Promise<Record<string, unknown> | null> {
  // Сначала проверяем права доступа через getAudit
  const audit = await getAudit(auditId)
  if (!audit) {
    throw new Error('Audit not found or access denied')
  }

  const { data, error } = await supabase
    .from('audits')
    .select('annotations')
    .eq('id', auditId)
    .single()

  if (error) throw error
  return data?.annotations || null
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}

export async function updateProject(projectId: string, updates: { name?: string; description?: string }): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)

  if (error) throw error
}

export async function updateAuditName(auditId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('audits')
    .update({ name })
    .eq('id', auditId)

  if (error) {
    console.error('Error updating audit name:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function deleteAnnotations(auditId: string): Promise<void> {
  // Сначала проверяем права доступа через getAudit
  const audit = await getAudit(auditId)
  if (!audit) {
    throw new Error('Audit not found or access denied')
  }

  const { error } = await supabase
    .from('audits')
    .update({
      annotations: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', auditId)

  if (error) throw error
}

export async function deleteAudit(auditId: string): Promise<void> {
  // Сначала проверяем права доступа через getAudit
  const audit = await getAudit(auditId)
  if (!audit) {
    throw new Error('Audit not found or access denied')
  }

  // Удаляем аудит
  const { error } = await supabase
    .from('audits')
    .delete()
    .eq('id', auditId)

  if (error) throw error
}



export async function getAudit(id: string): Promise<Audit | null> {
  // Получаем аудит - RLS автоматически проверит права доступа
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// Audit History functions
export async function addAuditHistory(
  auditId: string,
  actionType: string,
  inputData: Record<string, unknown>,
  outputData: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('audit_history')
    .insert({
      audit_id: auditId,
      action_type: actionType,
      input_data: inputData,
      output_data: outputData
    })

  if (error) throw error
}

export async function getAuditHistory(auditId: string) {
  const { data, error } = await supabase
    .from('audit_history')
    .select('*')
    .eq('audit_id', auditId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Storage functions
export async function uploadScreenshot(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('audit-uploads')
    .upload(fileName, file)

  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('audit-uploads')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadScreenshotFromBase64(base64Data: string, userId: string): Promise<string> {
  try {
    // Преобразуем base64 в Blob
    const base64Response = await fetch(base64Data)
    const blob = await base64Response.blob()
    
    // Определяем расширение файла из MIME типа
    const mimeType = blob.type
    const fileExt = mimeType.split('/')[1] || 'png'
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    console.log('Uploading screenshot:', { fileName, size: blob.size, type: mimeType })
    
    const { data, error } = await supabase.storage
      .from('audit-uploads')
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }
    
    console.log('Screenshot uploaded successfully:', data)
    
    const { data: { publicUrl } } = supabase.storage
      .from('audit-uploads')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading screenshot from base64:', error)
    throw error
  }
}

// Authentication helper
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  // Всегда редиректим на /auth/callback - там определится куда дальше
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) throw error

  // Если регистрация успешна и есть пользователь, создаем начальный баланс
  if (data.user) {
    await ensureUserHasInitialBalance(data.user.id)
  }

  return data
}

export async function signInWithGoogle() {
  // Всегда редиректим на /auth/callback - там определится куда дальше
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function ensureUserHasInitialBalance(userId: string): Promise<void> {
  try {
    console.log('🔍 ensureUserHasInitialBalance вызвана для пользователя:', userId)
    console.log('🔍 Текущее время в ensureUserHasInitialBalance:', new Date().toISOString())
    console.log('🔍 URL для API:', '/api/ensure-user-balance')
    
    // Вызываем API для создания баланса
    console.log('🔍 Отправляем запрос к API ensure-user-balance...')
    const response = await fetch('/api/ensure-user-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    })

    console.log('🔍 Ответ от API:', { 
      status: response.status, 
      ok: response.ok, 
      statusText: response.statusText 
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Ошибка API ensure-user-balance:', errorData)
      console.error('❌ Статус ответа:', response.status)
      return
    }

    const result = await response.json()
    console.log('✅ ensureUserHasInitialBalance API результат:', result)
    console.log('✅ Успешно обработано для пользователя:', userId)
    
  } catch (error) {
    console.error('❌ Ошибка при вызове API ensure-user-balance:', error)
    console.error('❌ Детали ошибки:', error)
    console.error('❌ Тип ошибки:', typeof error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack')
  }
}
