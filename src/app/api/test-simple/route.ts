import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API работает!',
    timestamp: new Date().toISOString()
  })
}