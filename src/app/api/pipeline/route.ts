import { NextResponse } from "next/server";
import { getPipeline } from "@/lib/airtable";

export async function GET() {
  try {
    const items = await getPipeline();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch pipeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline" },
      { status: 500 }
    );
  }
}
