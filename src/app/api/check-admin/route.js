import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const adminEmails = ["augustineosezua1@gmail.com", "tristanmerkley@gmail.com", "patrickosezua1@gmail.com"];
  const { email } = await request.json();
  return NextResponse.json({
    isAdmin: !!email && adminEmails.includes(email),
  });
}
