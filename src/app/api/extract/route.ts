import { NextRequest, NextResponse } from "next/server";
import {
  getContentById,
  getUnextractedContent,
  updateExtraction,
} from "@/lib/supabase";
import type { ContentItem } from "@/lib/scoring";

// --- Ghost Blog Extraction ---
async function extractFromGhost(item: ContentItem): Promise<string | null> {
  const baseUrl = process.env.GHOST_API_BASE_URL;
  const key = process.env.GHOST_API_KEY;
  if (!baseUrl || !key) return null;

  // If we have a ghost_id, fetch directly
  if (item.ghost_id) {
    try {
      const res = await fetch(`${baseUrl}?key=${key}`);
      if (!res.ok) return null;
      const posts = await res.json();
      const post = Array.isArray(posts)
        ? posts.find((p: { id?: string; slug?: string }) => p.id === item.ghost_id || p.slug === item.ghost_id)
        : null;
      if (post?.plaintext) return post.plaintext;
      if (post?.html) return stripHtml(post.html);
    } catch {
      return null;
    }
  }

  // Fallback: fetch URL directly
  return await fetchAndExtractHtml(item.url);
}

// --- LinkedIn Extraction ---
async function extractFromLinkedIn(item: ContentItem): Promise<string | null> {
  if (!item.url) return null;
  return await fetchAndExtractHtml(item.url);
}

// --- Podcast (Fireflies) Extraction ---
async function extractFromFireflies(item: ContentItem): Promise<string | null> {
  if (!item.source_meeting_id) return null;

  const apiKey = process.env.FIREFLIES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `query { transcript(id: "${item.source_meeting_id}") { sentences { text } } }`,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const sentences = data?.data?.transcript?.sentences;
    if (!Array.isArray(sentences)) return null;
    return sentences.map((s: { text: string }) => s.text).join(" ");
  } catch {
    return null;
  }
}

// --- Utility: fetch URL and extract text from HTML ---
async function fetchAndExtractHtml(url?: string): Promise<string | null> {
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MediaPlayBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();
    return stripHtml(html);
  } catch {
    return null;
  }
}

// --- Strip HTML to plain text ---
function stripHtml(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Prefer article/main content
  const articleMatch =
    text.match(/<article[\s\S]*?<\/article>/i) ||
    text.match(/<main[\s\S]*?<\/main>/i);
  if (articleMatch) text = articleMatch[0];

  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// --- Generate summary and key claims from full text ---
function generateSummary(fullText: string): string {
  // Simple extractive summary: first 2-3 meaningful sentences
  const sentences = fullText
    .split(/[.!?。]\s+/)
    .filter((s) => s.length > 20)
    .slice(0, 3);
  return sentences.join(". ").substring(0, 500) + (sentences.length > 0 ? "." : "");
}

function extractKeyClaims(fullText: string, title: string): string[] {
  const claims: string[] = [];

  // Use title as primary claim
  if (title) claims.push(title);

  // Extract sentences with strong claim indicators
  const claimPatterns = [
    /(?:핵심은|요점은|결론은|중요한 것은|결국)[^.!?。]*[.!?。]/g,
    /(?:must|should|핵심|원칙|전략|프레임워크)[^.!?。]*[.!?。]/gi,
  ];

  for (const pattern of claimPatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      for (const m of matches.slice(0, 3)) {
        const claim = m.trim();
        if (claim.length > 15 && claim.length < 200) {
          claims.push(claim);
        }
      }
    }
  }

  return claims.slice(0, 5);
}

// --- Channel-based extraction router ---
async function extractContent(
  item: ContentItem
): Promise<{ full_text: string; summary: string; key_claims: string[] } | null> {
  let fullText: string | null = null;

  switch (item.channel) {
    case "blog":
      fullText = await extractFromGhost(item);
      break;
    case "linkedin":
      fullText = await extractFromLinkedIn(item);
      break;
    case "podcast":
      fullText = await extractFromFireflies(item);
      break;
    default:
      return null;
  }

  if (!fullText || fullText.length < 50) return null;

  const summary = generateSummary(fullText);
  const keyClaims = extractKeyClaims(fullText, item.title);

  return { full_text: fullText, summary, key_claims: keyClaims };
}

// --- POST /api/extract ---
// Extract content for a specific item or all unextracted items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, batch } = body;

    if (id) {
      // Single item extraction
      const item = await getContentById(id);
      const result = await extractContent(item);
      if (!result) {
        return NextResponse.json(
          { error: "추출 실패 — 콘텐츠에 접근할 수 없거나 지원하지 않는 채널입니다" },
          { status: 422 }
        );
      }
      const updated = await updateExtraction(id, result);
      return NextResponse.json({ item: updated });
    }

    if (batch) {
      // Batch extraction for all unextracted published content
      const items = await getUnextractedContent();
      const results: { id: string; title: string; status: string }[] = [];

      for (const item of items) {
        try {
          const result = await extractContent(item);
          if (result) {
            await updateExtraction(item.id, result);
            results.push({ id: item.id, title: item.title, status: "extracted" });
          } else {
            results.push({ id: item.id, title: item.title, status: "skipped" });
          }
        } catch {
          results.push({ id: item.id, title: item.title, status: "error" });
        }
      }

      return NextResponse.json({
        total: items.length,
        extracted: results.filter((r) => r.status === "extracted").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      });
    }

    return NextResponse.json({ error: "id 또는 batch: true 필요" }, { status: 400 });
  } catch (error) {
    console.error("Extract failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `추출 실패: ${message}` }, { status: 500 });
  }
}
