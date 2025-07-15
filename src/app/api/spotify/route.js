import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "@/app/lib/encrypt"; // Assuming you have an encrypt function
const crypto = require("crypto");
const prisma = new PrismaClient();

export async function POST(request) {
  const { userId } = await request.json();
  const result = await prisma.account.findFirst({
    where: { userId: userId, providerId: "spotify" },
  });
  let accessToken = result?.accessToken;
  let refreshToken = result?.refreshToken;
  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: "No Spotify account linked" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    accessToken: decrypt(accessToken, process.env.ENCRYPTION_KEY),
  });
}
