import { NextResponse } from "next/server";
import { getSharedQuotePayload } from "@/lib/sharedQuoteCache";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getSharedQuotePayload();
  return NextResponse.json(payload, {
    headers: getCacheHeaders(payload.isMock)
  });
}

function getCacheHeaders(isMock: boolean): HeadersInit {
  const ttlSeconds = isMock ? 60 : 600;
  const swrSeconds = isMock ? 30 : 120;

  return {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "CDN-Cache-Control": `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
    "Vercel-CDN-Cache-Control": `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`
  };
}
