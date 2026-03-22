import { NextRequest, NextResponse } from "next/server";
import { getContentById, updateContentStatus, updateContent } from "@/lib/supabase";
import type { ContentStatus } from "@/lib/scoring";

const STATUS_TRANSITION: ContentStatus[] = ["published", "dropped"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getContentById(id);
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to fetch content:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch content: ${message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, channel, content_type, status, target_date, topic, source_meeting_id } = body;

    // Simple status-only transition (published/dropped)
    if (status && !title && !channel && !content_type && target_date === undefined && !topic && source_meeting_id === undefined) {
      if (!STATUS_TRANSITION.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status transition. Allowed: ${STATUS_TRANSITION.join(", ")}` },
          { status: 400 }
        );
      }
      const item = await updateContentStatus(id, status);
      return NextResponse.json({ item });
    }

    // General field update
    const item = await updateContent(id, {
      ...(title !== undefined && { title }),
      ...(channel !== undefined && { channel }),
      ...(content_type !== undefined && { content_type }),
      ...(status !== undefined && { status }),
      ...(target_date !== undefined && { target_date }),
      ...(topic !== undefined && { topic }),
      ...(source_meeting_id !== undefined && { source_meeting_id }),
    });
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
