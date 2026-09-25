import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// OpenRouter speaks the OpenAI API, so the OpenAI SDK works with a different base URL
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    // Optional: shows the app by name in OpenRouter's usage dashboard
    "HTTP-Referer": process.env.BASE_URL || "https://peckodoro.vercel.app",
    "X-Title": "Peckodoro",
  },
});

// Any model ID from https://openrouter.ai/models
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

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

  let reply;
  try {
    const completion = await openrouter.chat.completions.create({
      model: MODEL,
      messages,
    });
    reply = completion.choices?.[0]?.message?.content;
  } catch (err) {
    console.error("OpenRouter request failed:", err?.status, err?.message);
  }

  if (!reply) {
    return NextResponse.json(
      { error: "The assistant didn't answer", conversationId: convoId },
      { status: 502 }
    );
  }

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
