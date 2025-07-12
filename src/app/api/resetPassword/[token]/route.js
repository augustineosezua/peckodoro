import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import {reactPasswordChangedEmail} from "@/app/lib/email/new-password";
const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const parms = await params;
  const id = parms.token;

  const verificationCol = await prisma.verification.findFirst({
    where: { identifier: "reset-password:" + id },
  });
  const userId = verificationCol?.value;

  const user = await prisma.user.findFirst({
    where: { id: userId },
  });

  return NextResponse.json({ email: user?.email, name: user?.name });
}

export async function POST(request, { params }) {
  const r = new Resend(process.env.RESEND_API_KEY);
  const { email, name } = await request.json();
  console.log(email);
  await r.emails.send({
    from: "Peckodoro <resetpasswords@freaksanta.online>",
    to: email,
    subject: "Recent Password Change",
    react: reactPasswordChangedEmail({
      username: name
    }),
  });
  return new NextResponse(null, { status: 200 });
}
