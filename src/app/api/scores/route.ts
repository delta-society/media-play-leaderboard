import { NextRequest, NextResponse } from "next/server";
import { getContentByDateRange } from "@/lib/airtable";
import {
  calculateWeeklyScore,
  getWeekDates,
  getCurrentWeek,
} from "@/lib/scoring";
import { MEMBERS } from "@/lib/members";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") || getCurrentWeek();

  try {
    const { start, end } = getWeekDates(week);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const scores = await Promise.all(
      MEMBERS.map(async (m) => {
        const items = await getContentByDateRange(startStr, endStr, m.id);
        const score = calculateWeeklyScore(items);
        return {
          member: m.id,
          week,
          ...score,
          content_count: items.length,
        };
      })
    );

    // Sort by total_points descending
    scores.sort((a, b) => b.total_points - a.total_points);

    return NextResponse.json({ scores, week });
  } catch (error) {
    console.error("Failed to calculate scores:", error);
    return NextResponse.json(
      { error: "Failed to calculate scores" },
      { status: 500 }
    );
  }
}
