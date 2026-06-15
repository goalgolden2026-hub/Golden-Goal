import { NextResponse } from 'next/server';
import { isWalletWhitelisted } from '@/lib/whitelist';

export function proxy(request) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // 1. Redirect non-www apex domain to www domain
  if (host === 'goldengoalsol.com') {
    const url = request.nextUrl.clone();
    url.host = 'www.goldengoalsol.com';
    return NextResponse.redirect(url, 308); // 308 Permanent Redirect preserves HTTP method and body
  }

  // 2. Add CORS headers for API routes - Handle preflight OPTIONS requests
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || '';
    const isAllowedOrigin = origin.endsWith('goldengoalsol.com') || origin.startsWith('http://localhost');
    const allowOrigin = isAllowedOrigin ? origin : '*';

    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Access-Control-Allow-Origin', allowOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      return response;
    }
  }

  // 3. Protect markets, dashboard, and rewards routes (whitelist verification)
  if (
    pathname.startsWith('/markets') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/rewards')
  ) {
    const connectedWalletCookie = request.cookies.get('connected_wallet');
    const walletAddress = connectedWalletCookie?.value;

    // Only redirect if a wallet is connected but it is not whitelisted.
    // This avoids redirect loops when cookies are delayed/missing on mobile/client-side navigation.
    if (walletAddress && !isWalletWhitelisted(walletAddress)) {
      // Securely redirect to the landing page
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 4. Append CORS headers to regular API responses
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    const origin = request.headers.get('origin') || '';
    const isAllowedOrigin = origin.endsWith('goldengoalsol.com') || origin.startsWith('http://localhost');
    const allowOrigin = isAllowedOrigin ? origin : '*';

    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};

