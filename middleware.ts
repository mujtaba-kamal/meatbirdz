import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    const pathname = req.nextUrl.pathname

    // If non-admin tries to access admin routes, redirect to home
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // If admin tries to access consumer pages (except login/register/api), redirect to admin panel
    if (isAdmin && !isAdminRoute && 
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/_next') &&
        pathname !== '/login' &&
        pathname !== '/register' &&
        pathname !== '/') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
        if (isAdminRoute) {
          return token?.role === 'ADMIN'
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/order-online/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/menu/:path*',
    '/payment/:path*',
  ],
}

