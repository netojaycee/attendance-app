import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { EncryptJWT, jwtDecrypt, type JWTPayload } from "jose";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random password for new users
 * 12 characters: mix of uppercase, lowercase, numbers, and special chars
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const all = uppercase + lowercase + numbers + special;

  let password = "";
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

/**
 * Format a full name from first and last name
 */
export function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Format bytes into human readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// --- JWE Secret Key Logic (hex to Uint8Array) ---
function hexToUint8Array(hexString: string | undefined): Uint8Array {
  if (!hexString) {
    throw new Error("Encryption key (COOKIE_SECRET) is not configured");
  }
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const cleanedHexString = hexString.replace(/"/g, "");
  const bytes = new Uint8Array(cleanedHexString.length / 2);
  for (let i = 0; i < cleanedHexString.length; i += 2) {
    bytes[i / 2] = parseInt(cleanedHexString.substring(i, i + 2), 16);
  }
  return bytes;
}

const secretKey = hexToUint8Array(process.env.NEXT_PUBLIC_COOKIE_SECRET);

/**
 * Creates a JWE encrypted token for the given payload.
 * @param payload The payload to encrypt (user, guest, etc.)
 * @param expiresIn Expiry time (e.g., '1h', '7d'). Default: '1h'.
 */
export async function encryptToken(
  payload: JWTPayload,
  expiresIn = "1h"
): Promise<string> {
  return await new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .encrypt(secretKey);
}

/**
 * Decrypts a JWE encrypted token and returns the payload.
 * @param token The encrypted token string.
 */
export async function decryptToken<T = JWTPayload>(token: string): Promise<T> {
  const { payload } = await jwtDecrypt(token, secretKey, {
    clockTolerance: "15s",
  });
  return payload as T;
}

export function setCookie(
  name: string,
  value: string,
  options: {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    domain?: string;
  } = {}
) {
  // Default options for Next.js: secure in production, lax samesite, path /
  const isProd = process.env.NODE_ENV === "production";
  const envDomain = process.env.COOKIE_DOMAIN; // Set this in your env, e.g., .domain.com
  const defaultOptions = {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "lax" : "strict",
    domain: envDomain || undefined,
    ...options,
  };

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (defaultOptions.maxAge !== undefined) {
    cookie += `; Max-Age=${defaultOptions.maxAge}`;
  }
  if (defaultOptions.path) {
    cookie += `; Path=${defaultOptions.path}`;
  }
  if (defaultOptions.domain) {
    cookie += `; Domain=${defaultOptions.domain}`;
  }
  if (defaultOptions.httpOnly) {
    cookie += `; HttpOnly`;
  }
  if (defaultOptions.secure) {
    cookie += `; Secure`;
  }
  if (defaultOptions.sameSite) {
    cookie += `; SameSite=${
      defaultOptions.sameSite.charAt(0).toUpperCase() +
      defaultOptions.sameSite.slice(1)
    }`;
  }

  return cookie;
}

export function deleteCookie(
  name: string,
  options: { path?: string; domain?: string } = {}
) {
  // Use same defaults as setCookie for path and domain
  const envDomain = process.env.COOKIE_DOMAIN;
  const defaultOptions = {
    path: "/",
    domain: envDomain || undefined,
    ...options,
  };
  let cookie = `${encodeURIComponent(name)}=; Max-Age=0`;
  if (defaultOptions.path) {
    cookie += `; Path=${defaultOptions.path}`;
  }
  if (defaultOptions.domain) {
    cookie += `; Domain=${defaultOptions.domain}`;
  }
  return cookie;
}

/**
 * Get the effective user ID based on impersonation status
 * If impersonation is active (iUser exists), return the impersonated user's ID
 * Otherwise, return the actual user's ID
 * @param user The actual user object from the user cookie
 * @param iUser The impersonated user object from the impersonation cookie (optional)
 * @returns The effective user ID or null if no user is logged in
 */
export function getEffectiveUserId(
  user: any,
  iUser: any
): string | null {
  if (iUser?.id) {
    return iUser.id; // Use impersonated user ID if impersonating
  }
  return user?.id ?? null; // Use actual user ID or null
}

/**
 * Get the effective user role based on impersonation status
 * If impersonation is active (iUser exists), return the impersonated user's role
 * Otherwise, return the actual user's role
 * @param user The actual user object from the user cookie
 * @param iUser The impersonated user object from the impersonation cookie (optional)
 * @returns The effective user role or null if no user is logged in
 */
export function getEffectiveUserRole(
  user: any,
  iUser: any
): string | null {
  if (iUser?.role) {
    return iUser.role; // Use impersonated user role if impersonating
  }
  return user?.role ?? null; // Use actual user role or null
}

/**
 * Get the effective user's first name based on impersonation status
 * If impersonation is active (iUser exists), return the impersonated user's first name
 * Otherwise, return the actual user's first name
 * @param user The actual user object from the user cookie
 * @param iUser The impersonated user object from the impersonation cookie (optional)
 * @returns The effective user's first name or null if no user is logged in
 */
export function getEffectiveUserFirstName(
  user: any,
  iUser: any
): string | null {
  if (iUser?.firstName) {
    return iUser.firstName; // Use impersonated user's first name if impersonating
  }
  return user?.firstName ?? null; // Use actual user's first name or null
}

/**
 * Get the effective user's last name based on impersonation status
 * If impersonation is active (iUser exists), return the impersonated user's last name
 * Otherwise, return the actual user's last name
 * @param user The actual user object from the user cookie
 * @param iUser The impersonated user object from the impersonation cookie (optional)
 * @returns The effective user's last name or null if no user is logged in
 */
export function getEffectiveUserLastName(
  user: any,
  iUser: any
): string | null {
  if (iUser?.lastName) {
    return iUser.lastName; // Use impersonated user's last name if impersonating
  }
  return user?.lastName ?? null; // Use actual user's last name or null
}


/**
 * Generate a URL-friendly slug from a name
 * Converts to lowercase and separates words with hyphens
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}