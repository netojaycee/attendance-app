/**
 * Protected Routes & API Configuration
 * Defines which routes and APIs require authentication and role-based access
 * APIs also support method-based access control (GET, POST, PATCH, DELETE, etc.)
 */

import { Role } from "@/prisma/generated/enums";

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

interface ProtectedRoute {
  path: string;
  roles?: Role[]; // If undefined, any authenticated user can access
}

interface ProtectedAPI {
  path: string;
  roles?: Role[]; // If undefined, any authenticated user can access
  methods?: {
    [key in HTTPMethod]?: Role[]; // Method-specific roles. If undefined, inherits from roles
  };
}

/**
 * Protected Pages/Routes - requires authentication
 * Redirects to /login if not authenticated
 * If roles are specified, redirects to /dashboard if user doesn't have required role
 */
export const protectedPages: ProtectedRoute[] = [
  { path: "/dashboard", roles: undefined }, // All authenticated users
  { path: "/attendance", roles: undefined },
  { path: "/stats", roles: [Role.ADMIN, Role.DISTRICT_LEADER] },
  { path: "/events", roles: undefined },
  { path: "/admin", roles: [Role.ADMIN] },
  { path: "/management", roles: [Role.ADMIN, Role.DISTRICT_LEADER] },
  { path: "/profile", roles: undefined },
];

/**
 * Protected APIs - requires authentication
 * Returns 401 if not authenticated
 * Returns 403 if user doesn't have required role or method not allowed
 *
 * Method-specific access:
 * - If methods are defined, only those methods are protected
 * - GET typically allows all authenticated users unless specified otherwise
 * - POST, PATCH, DELETE typically require specific roles
 */
export const protectedAPIs: ProtectedAPI[] = [
  {
    path: "/api/v1/attendance",
    roles: undefined,
    methods: {
      GET: undefined, // All authenticated users
      POST: undefined, // All authenticated users
      PATCH: [Role.ADMIN, Role.DISTRICT_LEADER, Role.PART_LEADER],
    },
  },
  {
    path: "/api/v1/auth/logout",
    roles: undefined,
  },
  {
    path: "/api/v1/events",
    roles: undefined,
    methods: {
      GET: undefined, // All authenticated users
      POST: [Role.ADMIN, Role.DISTRICT_LEADER],
      PATCH: [Role.ADMIN, Role.DISTRICT_LEADER],
      DELETE: [Role.ADMIN, Role.DISTRICT_LEADER],
    },
  },
  {
    path: "/api/v1/sessions",
    roles: undefined,
    methods: {
      GET: undefined, // All authenticated users
      POST: [Role.ADMIN, Role.DISTRICT_LEADER],
      PATCH: [Role.ADMIN, Role.DISTRICT_LEADER],
      DELETE: [Role.ADMIN, Role.DISTRICT_LEADER],
    },
  },
  {
    path: "/api/v1/users",
    roles: [Role.ADMIN],
    methods: {
      GET: [Role.ADMIN],
      POST: [Role.ADMIN],
      PATCH: [Role.ADMIN],
      DELETE: [Role.ADMIN],
    },
  },
  {
    path: "/api/v1/auth/impersonate",
    roles: [Role.ADMIN, Role.DISTRICT_LEADER, Role.PART_LEADER],
    methods: {
      POST: [Role.ADMIN, Role.DISTRICT_LEADER, Role.PART_LEADER],
      DELETE: [Role.ADMIN, Role.DISTRICT_LEADER, Role.PART_LEADER],
    },
  },
];

/**
 * Public routes - no authentication required
 */
export const publicRoutes = ["/login", "/register", "/auth"];

/**
 * Check if a route is protected
 */
export function isProtectedPage(pathname: string): boolean {
  return protectedPages.some((route) => pathname.startsWith(route.path));
}

/**
 * Check if an API is protected
 */
export function isProtectedAPI(pathname: string): boolean {
  return protectedAPIs.some((route) => pathname.startsWith(route.path));
}

/**
 * Get the required roles for a protected route/API
 * Returns undefined if any authenticated user can access
 * Returns empty array if route is not protected
 * For APIs with method-specific access, returns roles for that method
 */
export function getRequiredRoles(
  pathname: string,
  isAPI: boolean = false,
  method?: HTTPMethod
): Role[] | undefined {
  const routes = isAPI ? protectedAPIs : protectedPages;
  const route = routes.find((r) => pathname.startsWith(r.path)) as
    | ProtectedAPI
    | ProtectedRoute
    | undefined;

  if (!route) return undefined;

  // For APIs with method-specific access
  if (isAPI && method && (route as ProtectedAPI).methods) {
    const apiRoute = route as ProtectedAPI;
    const methodRoles = apiRoute.methods?.[method];

    // If method has specific roles, use them
    if (methodRoles !== undefined) {
      return methodRoles;
    }

    // If method is not in the methods map, fallback to default roles
    if (apiRoute.methods && !(method in apiRoute.methods)) {
      // Method not in methods map means it's not explicitly protected
      // So we check if there's a default role requirement
      return apiRoute.roles;
    }
  }

  // For routes without method-specific access, return default roles
  return (route as ProtectedRoute).roles;
}

/**
 * Check if a method is allowed for an API route
 * Returns true if method is allowed (either not restricted or user has required role)
 * Returns false if method is restricted and user doesn't have required role
 */
export function isMethodAllowed(
  pathname: string,
  method: HTTPMethod,
  userRole: Role | undefined
): boolean {
  const apiRoute = protectedAPIs.find((r) => pathname.startsWith(r.path));

  if (!apiRoute) return true; // Not an API route, allow

  // If methods are not defined, allow all methods with default role check
  if (!apiRoute.methods) {
    return hasRequiredRole(userRole, apiRoute.roles);
  }

  // If method is specifically defined in methods map
  if (method in apiRoute.methods) {
    const methodRoles = apiRoute.methods[method];
    return hasRequiredRole(userRole, methodRoles);
  }

  // If method is not in the methods map, allow with default roles
  return hasRequiredRole(userRole, apiRoute.roles);
}

/**
 * Check if user has required role for a route/API
 */
export function hasRequiredRole(
  userRole: Role | undefined,
  requiredRoles: Role[] | undefined
): boolean {
  if (!requiredRoles) return true; // No role requirement
  if (!userRole) return false; // User has no role but route requires one
  return requiredRoles.includes(userRole);
}
