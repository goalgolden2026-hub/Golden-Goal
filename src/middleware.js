import { NextResponse } from 'next/server';
import { isWalletWhitelisted } from '@/lib/whitelist';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect markets, dashboard, and rewards routes
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/markets/:path*',
    '/dashboard/:path*',
    '/rewards/:path*',
  ],
};
