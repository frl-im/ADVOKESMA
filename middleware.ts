import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory KV store for rate-limiting.
// Note: In a true Serverless/Edge environment (like Vercel), this cache may reset between cold starts.
// For production scale, it's recommended to use a distributed KV store like Redis (e.g., @upstash/redis).
const rateLimitCache = new Map<string, { count: number; expiresAt: number }>();

export function middleware(request: NextRequest) {
  // 1. Rate Limiting Logic (specifically on /api/aspirations endpoint)
  if (request.nextUrl.pathname.startsWith('/api/aspirations') && request.method === 'POST') {
    // Get IP address (fallback to 'unknown' if not available in headers)
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';

    // We can also rate-limit by User ID if authenticated via token
    // For this example, we'll rate-limit by IP address as a base security measure.
    const rateLimitKey = `rate-limit:${ip}`;

    const now = Date.now();
    const WINDOW_MS = 60 * 60 * 1000; // 1 Hour
    const MAX_REQUESTS = 3;

    let userRequestInfo = rateLimitCache.get(rateLimitKey);

    if (!userRequestInfo || userRequestInfo.expiresAt < now) {
      // First request or window expired
      userRequestInfo = { count: 1, expiresAt: now + WINDOW_MS };
    } else {
      userRequestInfo.count += 1;
    }

    // Update the cache
    rateLimitCache.set(rateLimitKey, userRequestInfo);

    if (userRequestInfo.count > MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Maximum 3 submissions per hour are allowed.' },
        { status: 429 }
      );
    }
  }

  // 2. Role-Based Access Control (RBAC) Logic
  // Assuming authentication writes a secure HTTP-Only cookie 'session-token' carrying a JWT
  // or that we use something like NextAuth.js. 
  // We mock the role extraction here for demonstration purposes.
  const sessionCookie = request.cookies.get('session-token')?.value;

  // Protect the Recap Dashboard: Only Advocacy Chair
  if (request.nextUrl.pathname.startsWith('/recap')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // In a real app, you would parse and verify the JWT here.
    // Example: const payload = await verifyToken(sessionCookie);
    const mockDecodedRole = getRoleFromTokenMock(sessionCookie);

    if (mockDecodedRole !== 'ADVOCACY_CHAIR') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Protect the Aspiration Form: Only Students
  if (request.nextUrl.pathname === '/dashboard') {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const mockDecodedRole = getRoleFromTokenMock(sessionCookie);

    if (mockDecodedRole !== 'STUDENT') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Protect Admin Dashboard: Only Admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const mockDecodedRole = getRoleFromTokenMock(sessionCookie);

    if (mockDecodedRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

// Mock function for demonstrating token decoding
function getRoleFromTokenMock(token: string) {
  // Fake decode logic based on token composition
  if (token.includes('admin')) return 'ADMIN';
  if (token.includes('advocacy')) return 'ADVOCACY_CHAIR';
  return 'STUDENT';
}

export const config = {
  // Matcher allows Next.js to skip running middleware on static files, images, etc.
  matcher: [
    '/api/aspirations/:path*',
    '/recap/:path*',
    '/dashboard/:path*',
    '/admin/:path*'
  ]
};
