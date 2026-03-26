import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

export default NextAuth(authConfig).auth

export const config = {
  matcher: ['/projects/:path*', '/api/projects/:path*', '/settings/:path*', '/api/backup/:path*', '/admin/:path*', '/api/users/:path*'],
}
