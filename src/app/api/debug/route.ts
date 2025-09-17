import { NextResponse } from 'next/server'

export async function GET() {
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
    openaiKey: process.env.OPENAI_API_KEY ? 'PRESENT' : 'MISSING',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'
  }
  
  return NextResponse.json({ env, timestamp: new Date().toISOString() })
}










