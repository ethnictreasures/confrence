import { auth, isAdminRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  const hasAdminRole = isAdminRole(req.auth?.user?.role);

  if (isAdminRoute && !isLoginPage) {
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  if (isLoginPage && hasAdminRole) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
