import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { getDeveloperToken } from "@/app/lib/apple-music";

// Hands signed-in users the developer token MusicKit needs to start.
// MusicKit runs in the browser, so this token is public by design.
export async function GET(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to use Apple Music" }, { status: 401 });
  }
  try {
    const { token, expiresAt } = getDeveloperToken();
    return NextResponse.json(
      { token, expiresAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Apple Music isn't set up" }, { status: 500 });
  }
}
