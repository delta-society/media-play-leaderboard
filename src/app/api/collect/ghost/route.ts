import { NextRequest, NextResponse } from "next/server";
import { addContent, checkGhostIdExists } from "@/lib/airtable";
import { MEMBERS } from "@/lib/members";

interface GhostPost {
  id: string;
  blogId: string;
  title: string;
  slug: string;
  url: string;
  published_at: string;
  plaintext?: string;
  html?: string;
}

function estimateContentType(
  plaintext: string | undefined
): "original_long" | "original_mid" {
  const length = plaintext?.length || 0;
  return length >= 1500 ? "original_long" : "original_mid";
}

function getMemberByBlogId(blogId: string): string | undefined {
  const blogMapping: Record<string, string> = {
    "re-builder": "woong",
    thefuturemundane: "sung",
  };
  return blogMapping[blogId];
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ghostApiUrl = process.env.GHOST_API_BASE_URL;
    const ghostApiKey = process.env.GHOST_API_KEY;

    if (!ghostApiUrl || !ghostApiKey) {
      return NextResponse.json(
        { error: "Ghost API not configured" },
        { status: 500 }
      );
    }

    // Fetch all posts from Ghost aggregation API
    const response = await fetch(`${ghostApiUrl}?key=${ghostApiKey}`);
    if (!response.ok) {
      throw new Error(`Ghost API returned ${response.status}`);
    }

    const posts: GhostPost[] = await response.json();
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const post of posts) {
      try {
        // Check if already imported
        const exists = await checkGhostIdExists(post.id);
        if (exists) {
          skipped++;
          continue;
        }

        // Determine member from blogId
        const member = getMemberByBlogId(post.blogId);
        if (!member) {
          skipped++;
          continue;
        }

        const contentType = estimateContentType(post.plaintext);

        await addContent({
          member,
          title: post.title,
          url: post.url,
          channel: "blog",
          content_type: contentType,
          published_at: post.published_at,
          source: "ghost_auto",
          ghost_id: post.id,
        });

        added++;
      } catch (err) {
        errors.push(`Failed to process post ${post.id}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      added,
      skipped,
      total: posts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Ghost collection failed:", error);
    return NextResponse.json(
      { error: "Ghost collection failed" },
      { status: 500 }
    );
  }
}
