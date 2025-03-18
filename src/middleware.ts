import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only protect admin routes, but not login
  if (pathname.startsWith('/admin') && 
      !pathname.startsWith('/admin/login')) {
    
    // Check for token in cookies first (more reliable for middleware)
    const token = request.cookies.get('admin_token')?.value;
    
    // If no token found, redirect to login
    if (!token) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
    
    // If token exists, let the request proceed
    return NextResponse.next();
  }
  
  // For other routes, proceed normally
  return NextResponse.next();
}

// Configure what paths this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all paths starting with /admin
     * except for /admin/login
     */
    '/admin/:path*',
  ],
};