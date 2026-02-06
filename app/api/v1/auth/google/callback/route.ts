import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encryptToken, setCookie, deleteCookie } from "@/lib/utils";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

// GET /api/v1/auth/google/callback?code=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect("/");
  }
  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect("/");
  }
  // Get user info
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await userRes.json();
  if (!profile.email) {
    return NextResponse.redirect("/");
  }

  // Find user in DB - NO CREATION
  const user = await prisma.user.findUnique({ where: { email: profile.email } });
  
  if (!user) {
    // User doesn't exist - redirect to login with error message
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("error", "account_not_found");
    loginUrl.searchParams.set("email", encodeURIComponent(profile.email));
    return NextResponse.redirect(loginUrl.toString());
  }

  // Clear guest cookie if present
  const impersonateCookieName = process.env.NEXT_PUBLIC_IMPERSONATION_COOKIE_NAME!;
  const impersonateCookieClear = deleteCookie(impersonateCookieName);

  // Generate your own JWT and set cookie
  const { password: _pw, ...userWithoutPassword } = user;
  const token = await encryptToken(userWithoutPassword, "7d");
  const userCookie = setCookie(process.env.NEXT_PUBLIC_COOKIE_NAME!, token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
  });

  // Redirect to dashboard with cookies set
  return new NextResponse(null, {
    status: 302,
    headers: {
      "Location": "/dashboard",
      "Set-Cookie": [userCookie, impersonateCookieClear].join(", "),
    },
  });
}
