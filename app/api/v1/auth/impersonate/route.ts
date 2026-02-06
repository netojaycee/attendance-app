import { NextRequest, NextResponse } from "next/server";
import { encryptToken, setCookie } from "@/lib/utils";

// POST /api/v1/auth/guest
export async function POST(req: NextRequest) {
  const { userId, firstName, lastName } = await req.json();
  // Create impersonation payload
  const impersonatePayload = {
    id: userId,
    firstName,
    lastName,
    createdAt: new Date().toISOString(),
  };
  // Encrypt the session
  const token = await encryptToken(impersonatePayload, "30m");
  // Use guest cookie name from env
  const impersonateCookie = setCookie(
    process.env.NEXT_PUBLIC_IMPERSONATION_COOKIE_NAME!,
    token,
    {
      httpOnly: true,
      maxAge: 30 * 60, // 30 minutes
    }
  );
  // Clear user cookie if present
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Set-Cookie": impersonateCookie,
      "Content-Type": "application/json",
    },
  });
}

// endpoint to end impersonation
export async function DELETE(_req: NextRequest) {
  // remove the impersonation cookie
  const impersonateCookie = process.env.NEXT_PUBLIC_IMPERSONATION_COOKIE_NAME!;
  const impersonateClear = setCookie(impersonateCookie, "", {
    httpOnly: true,
    maxAge: 0,
  });
  const response = new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
  response.headers.append("Set-Cookie", impersonateClear);
  return response;
}
