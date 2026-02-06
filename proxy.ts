/**
 * Middleware: Server-side route and API protection proxy
 * Handles authentication, role-based access control, method-based access, and request enrichment
 * - Redirects unauthenticated users to /login for protected pages
 * - Returns 401/403 for unauthorized API requests
 * - Checks HTTP method for API endpoints (GET/POST/PATCH/DELETE)
 * - Attaches userId and userRole to request headers for API routes
 * - Supports user impersonation via cookies
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedPage,
  isProtectedAPI,
  getRequiredRoles,
  hasRequiredRole,
  isMethodAllowed,
  publicRoutes,
  type HTTPMethod,
} from "@/lib/protected-routes";
import { getAppSession } from "./lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase() as HTTPMethod;

  // Get session from cookies
  const { user } = await getAppSession();

  // Get effective user info based on impersonation status
  const isAuthenticated = !!user; // User is authenticated if user cookie exists

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isPublicRoute) {
    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // --- HANDLE PROTECTED PAGES (UI Routes) ---
  if (isProtectedPage(pathname)) {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check role-based access for pages
    const requiredRoles = getRequiredRoles(pathname, false);
    if (!hasRequiredRole(user.role as any, requiredRoles)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // --- HANDLE PROTECTED APIs ---
  if (isProtectedAPI(pathname)) {
    // Return 401 if not authenticated
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized: No valid session" },
        { status: 401 }
      );
    }

    // Check method-based access control
    const methodAllowed = isMethodAllowed(pathname, method, user.role as any);
    if (!methodAllowed) {
      return NextResponse.json(
        { error: "Forbidden: This method is not allowed for your role" },
        { status: 403 }
      );
    }

    // Clone the request and attach userId and userRole to headers
    // const requestHeaders = new Headers(req.headers);
    // requestHeaders.set("x-user-id", effectiveUserId);
    // requestHeaders.set("x-user-role", role || "");
    // requestHeaders.set("x-user-first-name", effectiveUserFirstName || "");
    // requestHeaders.set("x-user-last-name", effectiveUserLastName || "");

    // Create new request with updated headers
    return NextResponse
      .next
      //   {
      //   request: {
      //     headers: requestHeaders,
      //   },
      // }
      ();
  }

  // Allow other requests to proceed
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files, images, and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
