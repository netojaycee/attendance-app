import { getAppSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("GET /api/session called", req.url);
  const { user } = await getAppSession();

  return NextResponse.json({ user }, { status: 200 });
}
