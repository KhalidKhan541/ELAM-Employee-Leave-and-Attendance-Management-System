/** Authentication: bcrypt hashes + signed JWT in an httpOnly cookie. */
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { AuthenticationError, AuthorizationError } from './errors';

export const SESSION_COOKIE = 'elams_session';

export interface SessionPayload {
  sub: string;
  role: string;
  name: string;
  email: string;
  departmentId: string;
}

function secretKey(): Uint8Array {
  const value = process.env.JWT_SECRET ?? 'local-dev-secret-please-replace-with-a-long-random-value';
  return new TextEncoder().encode(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthenticationError('Please sign in to continue');
  return session;
}

export async function requireRole(...roles: string[]): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    throw new AuthorizationError('You do not have permission to view this page');
  }
  return session;
}
