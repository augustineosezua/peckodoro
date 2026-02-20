import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  const { conversationId, message, userId } = await request.json();

  if (!userId || !message) {
    return NextResponse.json(
      { error: "userId and message are required" },
      { status: 400 }
    );
  }

  let convoId = conversationId;

  // Create a new conversation if none provided
  if (!convoId) {
    const title =
      message.length > 50 ? message.substring(0, 50) + "..." : message;
    const conversation = await prisma.conversation.create({
      data: { userId, title },
    });
    convoId = conversation.id;
  }

  // Save the user's message
  await prisma.message.create({
    data: {
      conversationId: convoId,
      role: "user",
      content: message,
    },
  });

  // Fetch all prior messages for context (memory)
  const history = await prisma.message.findMany({
    where: { conversationId: convoId },
    orderBy: { createdAt: "asc" },
  });

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful study assistant built into Peckodoro, a Pomodoro timer app. Help users with study tips, productivity advice, and general questions. Keep responses concise and friendly.",
    },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  const reply = completion.choices[0].message.content;

  // Save the assistant's response
  const savedMessage = await prisma.message.create({
    data: {
      conversationId: convoId,
      role: "assistant",
      content: reply,
    },
  });

  return NextResponse.json({
    conversationId: convoId,
    reply,
    messageId: savedMessage.id,
  });
}
