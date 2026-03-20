import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
