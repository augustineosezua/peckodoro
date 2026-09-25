import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { deleteUserToken, getUserToken, saveUserToken } from "@/app/lib/apple-music";

const NO_STORE = { "Cache-Control": "no-store" };

// The signed-in user's Apple Music sign-in, stored against their Peckodoro account
async function userId(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id || null;
}

const unauthorized = () =>
  NextResponse.json({ error: "Log in to use Apple Music" }, { status: 401 });

export async function GET(request) {
  const id = await userId(request);
  if (!id) return unauthorized();
  const token = await getUserToken(id);
  return NextResponse.json({ token }, { headers: NO_STORE });
}

export async function PUT(request) {
  const id = await userId(request);
  if (!id) return unauthorized();
  const { token } = await request.json().catch(() => ({}));
  if (typeof token !== "string" || !token || token.length > 4096) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  await saveUserToken(id, token);
  return NextResponse.json({ saved: true }, { headers: NO_STORE });
}

export async function DELETE(request) {
  const id = await userId(request);
  if (!id) return unauthorized();
  await deleteUserToken(id);
  return NextResponse.json({ deleted: true }, { headers: NO_STORE });
}
