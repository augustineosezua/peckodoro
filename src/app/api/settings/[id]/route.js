import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  // params.id comes from [id] in your route filename
  const { id } = await params;

  // Optionally: console.log(id);
  const settings = await prisma.settings.findUnique({
    where: { userId: id },
  });

  return NextResponse.json(settings);
}

export async function POST(request, { params }) {
  const data = await request.json();

  const updateUser = await prisma.settings.update({
    where: { userId: data.userId },
    data: {
      focusTime: data.focusTime || 25,
      shortBreak: data.shortBreak || 5,
      longBreak: data.longBreak || 15,
      focusBeforeLong: data.focusBeforeLong || 3,
      autoStart: data.autoStart || false,
    },
  });
  return NextResponse.json({message: "settings updated"});
}

