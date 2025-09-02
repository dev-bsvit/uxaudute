import { supabase } from './supabase'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']
type Project = Tables['projects']['Row']
type Audit = Tables['audits']['Row']
type AuditInsert = Tables['audits']['Insert']
type AuditHistory = Tables['audit_history']['Insert']

// Projects functions
export async function createProject(name: string, description?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      description
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

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

// Audits functions
export async function createAudit(
  projectId: string,
  name: string,
  type: AuditInsert['type'],
  inputData: Record<string, unknown>
): Promise<Audit> {
  const { data, error } = await supabase
    .from('audits')
    .insert({
      project_id: projectId,
      name,
      type,
      status: 'in_progress',
      input_data: inputData
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

export async function getProjectAudits(projectId: string): Promise<Audit[]> {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAudit(id: string): Promise<Audit | null> {
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
