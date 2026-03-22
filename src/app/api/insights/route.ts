import { NextRequest, NextResponse } from "next/server";
import { getMemberInsights, upsertMemberInsights } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const member = searchParams.get("member") || undefined;

  try {
    const insights = await getMemberInsights(member);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { member, suggestions } = body;

    if (!member || !Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: "member (string) and suggestions (array) required" },
        { status: 400 }
      );
    }

    const insight = await upsertMemberInsights(member, suggestions);
    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Failed to upsert insights:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to upsert insights: ${message}` },
      { status: 500 }
    );
  }
}
