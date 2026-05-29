import crypto from 'crypto';

// Shared in-memory token store for admin sessions
const validTokens = new Set<string>();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function validatePassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function generateToken(): string {
  return crypto.createHash('sha256').update(ADMIN_PASSWORD + '-levir-salt').digest('hex');
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  const expectedToken = crypto.createHash('sha256').update(ADMIN_PASSWORD + '-levir-salt').digest('hex');
  return token === expectedToken;
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}
