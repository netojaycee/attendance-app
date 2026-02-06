import { NextRequest, NextResponse } from "next/server";
import { handleGoogleAuth, getRegistrationOptions } from "@/lib/services/auth.service";
import { encryptToken, setCookie, deleteCookie } from "@/lib/utils";

// Google OAuth2 endpoints
const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!; // e.g. https://yourdomain.com/api/v1/auth/google/callback

// GET /api/v1/auth/google
// Redirect user to Google OAuth
export async function GET(req: NextRequest) {
  console.log("Initiating Google OAuth flow", req.url);
  const url = new URL(GOOGLE_OAUTH_URL);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "offline");
  return NextResponse.redirect(url.toString());
}

// POST /api/v1/auth/google
// Handle Google OAuth callback and check if user exists
// Returns user data if exists, or google profile + registration options if new user
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
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
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 400 }
      );
    }

    // Get user info
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userRes.json();
    if (!profile.email) {
      return NextResponse.json(
        { error: "Failed to get user info" },
        { status: 400 }
      );
    }

    // Use auth service to check if user exists
    const result = await handleGoogleAuth(profile);

    // If user exists, login and set cookie
    if (result.userExists && result.user) {
      const guestCookieName = process.env.NEXT_PUBLIC_GUEST_COOKIE_NAME!;
      const guestCookieClear = deleteCookie(guestCookieName);

      // Generate auth token
      const token = await encryptToken(result.user, "7d");
      const userCookie = setCookie(process.env.NEXT_PUBLIC_COOKIE_NAME!, token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
      });

      return new NextResponse(
        JSON.stringify({
          success: true,
          userExists: true,
          user: result.user,
          message: result.message,
        }),
        {
          status: 200,
          headers: {
            "Set-Cookie": [userCookie, guestCookieClear].join(", "),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // New user - return google profile and registration options for frontend to show dropdown
    const registrationOptions = await getRegistrationOptions();

    return NextResponse.json({
      success: true,
      userExists: false,
      googleProfile: result.googleProfile,
      registrationOptions,
      message: result.message,
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
