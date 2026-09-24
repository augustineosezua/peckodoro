import { NextResponse } from "next/server";
import { getSpotifyAccount } from "@/app/lib/spotify-account";

// Is Spotify linked for the signed-in user? Never returns tokens.
export async function POST(request) {
  const { account, error, status } = await getSpotifyAccount(request);
  if (error) {
    return NextResponse.json({ linked: false, error }, { status });
  }
  return NextResponse.json({ linked: Boolean(account) });
}
