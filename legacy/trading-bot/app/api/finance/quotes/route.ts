import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Quotes API working ✅" });
}

export const runtime = "edge"export const runtime = "edge";

