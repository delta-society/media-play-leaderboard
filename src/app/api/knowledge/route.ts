import { NextRequest, NextResponse } from "next/server";
import { getAllPublishedContent, getMemberInsights } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const member = searchParams.get("member") || undefined;
  const channel = searchParams.get("channel") || undefined;
  const topic = searchParams.get("topic") || undefined;
  const search = searchParams.get("q") || undefined;

  try {
    const [items, insights] = await Promise.all([
      getAllPublishedContent({ member, channel, topic, search }),
      getMemberInsights(member),
    ]);
    const extracted = items.filter((i) => i.extracted_at);

    // Build insights map: member -> suggestions
    const insightsMap: Record<string, { suggestions: typeof insights[0]["suggestions"]; generated_at: string }> = {};
    for (const ins of insights) {
      insightsMap[ins.member] = {
        suggestions: ins.suggestions,
        generated_at: ins.generated_at,
      };
    }

    return NextResponse.json({
      items,
      insights: insightsMap,
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
