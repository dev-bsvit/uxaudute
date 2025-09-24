import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { userSettingsService } from '@/lib/i18n/user-settings'
import { isSupportedLanguage } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем языковые предпочтения пользователя
    const language = await userSettingsService.getLanguagePreference(user.id)

    return NextResponse.json({
      success: true,
      language: language || 'ru'
    })

  } catch (error) {
    console.error('Error getting user language preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем данные из запроса
    const { language } = await request.json()

    // Валидируем язык
    if (!language || !isSupportedLanguage(language)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported language' },
        { status: 400 }
      )
    }

    // Сохраняем языковые предпочтения
    await userSettingsService.saveLanguagePreference(user.id, language)

    return NextResponse.json({
      success: true,
      message: 'Language preference updated successfully'
    })

  } catch (error) {
    console.error('Error updating user language preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Сбрасываем языковые предпочтения на значение по умолчанию
    await userSettingsService.saveLanguagePreference(user.id, 'ru')

    return NextResponse.json({
      success: true,
      message: 'Language preference reset to default'
    })

  } catch (error) {
    console.error('Error resetting user language preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}