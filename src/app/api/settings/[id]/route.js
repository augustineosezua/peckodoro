import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// Only the signed-in user can read or change their own settings; the id in the
// URL must be theirs, and the body's userId is never trusted.
async function ownerId(request, params) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return { status: 401, error: "Log in to use saved settings" };
  const { id } = await params;
  if (id !== session.user.id) return { status: 403, error: "Not your settings" };
  return { id };
}

// Whole minutes/sessions, 1–999; anything else falls back to the default
const count = (value, fallback) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 999) : fallback;
};

export async function GET(request, { params }) {
  const { id, status, error } = await ownerId(request, params);
  if (error) return NextResponse.json({ error }, { status });

  const settings = await prisma.settings.findUnique({
    where: { userId: id },
  });
  return NextResponse.json(settings);
}

export async function POST(request, { params }) {
  const { id, status, error } = await ownerId(request, params);
  if (error) return NextResponse.json({ error }, { status });

  const data = await request.json().catch(() => ({}));
  await prisma.settings.update({
    where: { userId: id },
    data: {
      focusTime: count(data.focusTime, 25),
      shortBreak: count(data.shortBreak, 5),
      longBreak: count(data.longBreak, 15),
      focusBeforeLong: count(data.focusBeforeLong, 3),
      autoStart: data.autoStart === true,
    },
  });
  return NextResponse.json({ message: "settings updated" });
}
