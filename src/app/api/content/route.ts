import { NextRequest, NextResponse } from "next/server";
import { getContentByDateRange, addContent } from "@/lib/airtable";
import { getWeekDates, getCurrentWeek, type ContentType, type Channel } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") || getCurrentWeek();
  const member = searchParams.get("member") || undefined;

  try {
    const { start, end } = getWeekDates(week);
    const items = await getContentByDateRange(
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0],
      member
    );
    return NextResponse.json({ items, week });
  } catch (error) {
    console.error("Failed to fetch content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { member, title, url, channel, content_type, published_at, status, topic } = body;

    const contentStatus = status || "published";

    // idea/writing은 채널과 유형이 선택사항
    if (contentStatus === "published") {
      if (!member || !title || !channel || !content_type || !published_at) {
        return NextResponse.json(
          { error: "Missing required fields: member, title, channel, content_type, published_at" },
          { status: 400 }
        );
      }
    } else {
      if (!member || !title) {
        return NextResponse.json(
          { error: "Missing required fields: member, title" },
          { status: 400 }
        );
      }
    }

    const item = await addContent({
      member,
      title,
      url: url || "",
      channel: (channel || "other") as Channel,
      content_type: (content_type || "original_long") as ContentType,
      published_at: published_at || new Date().toISOString().split("T")[0],
      source: "manual_web",
      status: contentStatus,
      topic: Array.isArray(topic) ? topic : topic ? [topic] : undefined,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Failed to add content:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to add content: ${message}` },
      { status: 500 }
    );
  }
}
