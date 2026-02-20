import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(conversation);
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  await prisma.conversation.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Conversation deleted" });
}
