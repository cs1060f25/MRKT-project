import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-key-change-in-production'
);

const COOKIE_NAME = 'auth-token';
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a magic link token (stored in DB)
 */
export async function generateMagicLinkToken(email: string): Promise<string> {
  // Create a random token
  const token = crypto.randomUUID();

  // Store in database with expiry
  await prisma.authToken.create({
    data: {
      token,
      email,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  });

  return token;
}

/**
 * Verify magic link token and create session
 */
export async function verifyMagicLinkToken(token: string): Promise<SessionPayload | null> {
  const authToken = await prisma.authToken.findUnique({
    where: { token },
  });

  if (!authToken || authToken.expiresAt < new Date()) {
    return null;
  }

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { email: authToken.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: authToken.email,
        role: 'USER',
      },
    });
  }

  // Link token to user and delete it (one-time use)
  await prisma.authToken.update({
    where: { token },
    data: { userId: user.id },
  });

  await prisma.authToken.delete({
    where: { token },
  });

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

/**
 * Create a session JWT and set cookie
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  // Set cookie
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRY / 1000,
    path: '/',
  });

  return token;
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as SessionPayload;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Delete session cookie
 */
export async function deleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * Check if user is admin
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }

  return session;
}

/**
 * Check if user is authenticated (any role)
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
