import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    // Verify token and get user
    const session = await verifyMagicLinkToken(token);

    if (!session) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Create session cookie
    await createSession(session);

    // Redirect to admin dashboard if admin, otherwise to marketplace
    const redirectUrl = session.role === 'ADMIN' ? '/admin' : '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
  }
}
