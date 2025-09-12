import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST SUPABASE CONNECTION API вызван ===')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Supabase URL:', supabaseUrl)
    console.log('Anon Key length:', supabaseAnonKey?.length || 0)
    console.log('Service Key length:', supabaseServiceKey?.length || 0)
    console.log('Anon Key starts with:', supabaseAnonKey?.substring(0, 20) || 'N/A')
    console.log('Service Key starts with:', supabaseServiceKey?.substring(0, 20) || 'N/A')

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        details: {
          url: !!supabaseUrl,
          anonKey: !!supabaseAnonKey,
          serviceKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }

    // Тестируем подключение с anon key
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

    // Простой запрос к profiles (должен работать с RLS)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id')
      .limit(1)

    console.log('Profiles query result:', { data: profiles, error: profilesError })

    // Тестируем подключение с service key (если есть)
    let serviceKeyTest = null
    if (supabaseServiceKey) {
      const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: serviceProfiles, error: serviceError } = await supabaseServiceClient
        .from('profiles')
        .select('id')
        .limit(1)

      serviceKeyTest = {
        data: serviceProfiles,
        error: serviceError?.message || null
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection test completed',
      results: {
        url: supabaseUrl,
        anonKeyLength: supabaseAnonKey.length,
        serviceKeyLength: supabaseServiceKey?.length || 0,
        anonKeyTest: {
          data: profiles,
          error: profilesError?.message || null
        },
        serviceKeyTest
      }
    })

  } catch (error) {
    console.error('Error in test-supabase-connection API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
