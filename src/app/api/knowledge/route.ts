import { NextRequest, NextResponse } from "next/server";
import { getAllPublishedContent } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const member = searchParams.get("member") || undefined;
  const channel = searchParams.get("channel") || undefined;
  const topic = searchParams.get("topic") || undefined;
  const search = searchParams.get("q") || undefined;

  try {
    const items = await getAllPublishedContent({ member, channel, topic, search });
    const extracted = items.filter((i) => i.extracted_at);
    return NextResponse.json({
      items,
      stats: {
        total: items.length,
        extracted: extracted.length,
        pending: items.length - extracted.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge" },
      { status: 500 }
    );
  }
}
