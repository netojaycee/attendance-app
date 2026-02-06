import { loginSchema } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        districtId: true,
        voicePart: true,
        isVerified: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Ensure user.password is not null
    if (!user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Omit password from user object before tokenizing
    const { password: _pw, ...userWithoutPassword } = user;
    const token = await encryptToken(userWithoutPassword, "7d");

    // Create response with user data
    const response = NextResponse.json(
      { 
        message: "Login successful",
        data: userWithoutPassword,
      },
      { status: 200 }
    );

    // Set cookie using NextResponse.cookies
    response.cookies.set(process.env.NEXT_PUBLIC_COOKIE_NAME!, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error processing login:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
