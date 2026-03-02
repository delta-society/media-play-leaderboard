import { NextRequest, NextResponse } from "next/server";
import { updateContentStatus } from "@/lib/airtable";
import type { ContentStatus } from "@/lib/scoring";

const ALLOWED_STATUSES: ContentStatus[] = ["published", "dropped"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const item = await updateContentStatus(id, status);
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to update content:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update content: ${message}` },
      { status: 500 }
    );
  }
}
