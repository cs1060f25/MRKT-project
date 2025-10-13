import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { generateMagicLinkToken } from '@/lib/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = loginSchema.parse(body);

    // Generate magic link token
    const token = await generateMagicLinkToken(email);

    // In production, you would send an email here
    // For development, we return the token in the response
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email.',
      // Only include these in development
      ...(process.env.NODE_ENV === 'development' && {
        token,
        magicLink,
        devNote: 'In production, this would be sent via email. For now, use the link above.',
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
