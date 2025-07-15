import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(request) {
  const { userId } = await request.json();
  const result = await prisma.account.findFirst({
    where: { userId: userId, providerId: "spotify" },
  });
  let accessToken = result?.accessToken;
  let refreshToken = result?.refreshToken;
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append(
    "refresh_token",
    decrypt(refreshToken, process.env.ENCRYPTION_KEY)
  );
  if (accessTokenExpiresAt < now) {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      body: params.toString(),
    });
  }
  const json = await res.json();
  if (!json.error) {
    accessToken = encrypt(json.access_token, process.env.ENCRYPTION_KEY);
    refreshToken = encrypt(json.refresh_token, process.env.ENCRYPTION_KEY);
    await prisma.account.updateMany({
      where: { userId: userId, providerId: "spotify" },
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        accessTokenExpiresAt: new Date(Date.now() + json.expires_in * 1000),
      },
    });
  }

  return NextResponse.json({
    accessToken: decrypt(accessToken, process.env.ENCRYPTION_KEY),
  });
}
