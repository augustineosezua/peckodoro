import { NextResponse } from "next/server";
import { getSpotifyAccount, getFreshToken } from "@/app/lib/spotify-account";

// Hands the signed-in VIP a valid Spotify access token for the Web Playback SDK
export async function GET(request) {
  const { account, error, status } = await getSpotifyAccount(request);
  if (error) {
    return NextResponse.json({ error }, { status });
  }
  const token = await getFreshToken(account);
  if (token.error) {
    return NextResponse.json(
      { error: "Spotify needs to be reconnected" },
      { status: 401 }
    );
  }
  return NextResponse.json(token, {
    headers: { "Cache-Control": "no-store" },
  });
}
