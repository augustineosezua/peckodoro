import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { isAdminEmail } from "@/app/lib/admins";

// Answers for the signed-in user only, never for an email the client sends
export async function POST(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return NextResponse.json({
    isAdmin: isAdminEmail(session?.user?.email),
  });
}
