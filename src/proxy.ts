import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/about', '/team', '/sessions', '/policies', '/privacy']

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isAuthPage = path.startsWith('/login')
  const isApiAuth = path.startsWith('/api/auth')
  const isPublic = PUBLIC_PATHS.includes(path)

  if (isApiAuth || isPublic) return NextResponse.next()

  if (!isLoggedIn && !isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && isAuthPage) {
    const url = req.nextUrl.clone()
    url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
