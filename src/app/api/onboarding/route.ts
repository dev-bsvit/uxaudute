import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, role, interests, source } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже запись для этого пользователя
    const { data: existing } = await supabase
      .from('user_onboarding')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Обновляем существующую запись
      const { data, error } = await supabase
        .from('user_onboarding')
        .update({
          first_name: firstName,
          role,
          interests,
          source,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating onboarding:', error)
        return NextResponse.json(
          { error: 'Failed to update onboarding data' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Создаем новую запись
      const { data, error } = await supabase
        .from('user_onboarding')
        .insert({
          user_id: userId,
          first_name: firstName,
          role,
          interests,
          source,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating onboarding:', error)
        return NextResponse.json(
          { error: 'Failed to create onboarding data' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error('Error in onboarding API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json({ success: true, data: null })
      }
      console.error('Error fetching onboarding:', error)
      return NextResponse.json(
        { error: 'Failed to fetch onboarding data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in onboarding API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
