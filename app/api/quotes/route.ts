import { NextResponse } from "next/server";
import { fetchMarketQuotes } from "@/lib/marketData";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await fetchMarketQuotes();
  return NextResponse.json(payload);
}
