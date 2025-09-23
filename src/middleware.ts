import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { UserRole } from './types/auth';

const isProtectedRoute = createRouteMatcher(['/', '/houses(.*)', '/api(.*)', '/profile(.*)', '/settings(.*)', '/destinations(.*)', '/places(.*)', '/contacts(.*)', '/finance(.*)', '/requests(.*)', '/legals(.*)', '/audit-logs(.*)']);
const isPublicRoute = createRouteMatcher(['/landing', '/sign-in(.*)', '/sign-up(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSensitiveApiRoute = createRouteMatcher([
  '/api/properties/(.+)/internal',
  '/api/properties/(.+)/contacts',
  '/api/properties/(.+)/financial',
  '/api/properties/(.+)/owner',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const userRole = (sessionClaims as any)?.metadata?.role as UserRole | undefined;
  
  // Protect admin routes
  if (isAdminRoute(req) && userRole !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
  
  // Protect sensitive API routes
  if (isSensitiveApiRoute(req)) {
    if (!userRole || userRole === UserRole.VIEWER || userRole === UserRole.STAFF) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
  }
  
  // Don't protect public routes
  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};