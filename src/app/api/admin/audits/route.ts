import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Загрузка всех аудитов для админки')

    // Инициализируем Supabase client с service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем все аудиты со всеми пользователями
    const { data: audits, error } = await supabase
      .from('audits')
      .select(`
        id,
        project_name,
        status,
        created_at,
        updated_at,
        allow_blog_publication,
        input_data,
        user:profiles!audits_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Ошибка загрузки аудитов:', error)
      throw error
    }

    console.log(`✅ Загружено ${audits?.length || 0} аудитов`)

    return NextResponse.json({
      success: true,
      data: audits || []
    })

  } catch (error) {
    console.error('❌ Ошибка в API /admin/audits:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
