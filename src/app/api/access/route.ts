import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { ACCESS_COOKIE, ACCESS_COOKIE_MAX_AGE } from '@/lib/auth'

function safeCompare(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate)
  const expectedBuffer = Buffer.from(expected)

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const password = body?.password

  if (typeof password !== 'string' || password.trim().length === 0) {
    return NextResponse.json({ error: 'Password richiesta.' }, { status: 400 })
  }

  const expectedPassword = process.env.ACCESS_PASSWORD

  if (!expectedPassword) {
    return NextResponse.json({ error: 'Password non configurata.' }, { status: 500 })
  }

  const candidate = password.trim()

  if (!safeCompare(candidate, expectedPassword)) {
    return NextResponse.json({ error: 'Password non valida. Riprova.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: 'granted',
    httpOnly: true,
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
