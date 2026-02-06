import { loginSchema } from "@/lib/schema";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { encryptToken, setCookie } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Ensure user.password is not null
    if (!user.password) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

   

    // Omit password from user object before tokenizing
    const { password: _pw, ...userWithoutPassword } = user;
    const token = await encryptToken(userWithoutPassword, "7d");
    const userCookie = setCookie(process.env.NEXT_PUBLIC_COOKIE_NAME!, token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    // Login successful
    return Response.json(
      { message: "Login successful" },
      {
        status: 200,
        headers: {
          "Set-Cookie": [userCookie].join(", "),
        },
      }
    );
  } catch (error) {
    console.error("Error processing login:", error);
    return Response.json({ error: "Failed to login" }, { status: 500 });
  }
}
