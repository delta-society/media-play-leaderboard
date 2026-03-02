import { NextRequest, NextResponse } from "next/server";
import type { ContentType, Channel } from "@/lib/scoring";

interface AnalysisResult {
  title: string;
  channel: Channel;
  content_type: ContentType;
  charCount: number;
  isVideo: boolean;
  description: string;
}

const DOMAIN_CHANNEL_MAP: Record<string, Channel> = {
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "x.com": "x",
  "twitter.com": "x",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "youtu.be": "youtube",
  "podcasters.spotify.com": "podcast",
  "open.spotify.com": "podcast",
  "podcasts.apple.com": "podcast",
};

// Ghost blog domains for members
const BLOG_DOMAINS = [
  "thefuturemundane.com",
  "re-builder.ghost.io",
  "blog.delta-society.com",
];

function detectChannel(url: string): Channel {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    // Check exact domain map
    for (const [domain, channel] of Object.entries(DOMAIN_CHANNEL_MAP)) {
      if (hostname === domain || hostname === domain.replace(/^www\./, "")) {
        return channel;
      }
    }

    // Check blog domains
    for (const blogDomain of BLOG_DOMAINS) {
      if (hostname.includes(blogDomain.replace(/^www\./, ""))) {
        return "blog";
      }
    }

    // Heuristic: common blog platforms
    if (
      hostname.includes("ghost.io") ||
      hostname.includes("medium.com") ||
      hostname.includes("substack.com") ||
      hostname.includes("tistory.com") ||
      hostname.includes("velog.io") ||
      hostname.includes("brunch.co.kr")
    ) {
      return "blog";
    }

    return "other";
  } catch {
    return "other";
  }
}

function detectContentType(charCount: number, isVideo: boolean, channel: Channel): ContentType {
  // Video detection
  if (isVideo) {
    if (channel === "youtube") return "original_video"; // default to long video
    if (channel === "podcast") return "original_video";
    return "short_video";
  }

  // Text-based classification
  if (channel === "x") return "short"; // X posts are always short

  if (charCount >= 2000) return "original_long";
  if (charCount >= 300) return "original_mid";
  return "short";
}

function extractTextContent(html: string): string {
  // Remove script, style, nav, header, footer tags and their content
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Try to find article/main content first
  const articleMatch = text.match(/<article[\s\S]*?<\/article>/i) ||
    text.match(/<main[\s\S]*?<\/main>/i) ||
    text.match(/<div[^>]*class="[^"]*(?:content|post|article|entry)[^"]*"[\s\S]*?<\/div>/i);

  if (articleMatch) {
    text = articleMatch[0];
  }

  // Strip all HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function extractOgTag(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTitle(html: string): string {
  // Try OG title first
  const ogTitle = extractOgTag(html, "title");
  if (ogTitle) return ogTitle;

  // Try Twitter title
  const twitterMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  if (twitterMatch) return twitterMatch[1];

  // Fall back to <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the URL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MediaPlayBot/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      html = await res.text();
    } catch (fetchError) {
      clearTimeout(timeout);
      return NextResponse.json(
        { error: "URL을 가져올 수 없습니다" },
        { status: 422 }
      );
    }
    clearTimeout(timeout);

    // Extract metadata
    const title = extractTitle(html);
    const channel = detectChannel(url);
    const bodyText = extractTextContent(html);
    const charCount = bodyText.length;

    // Video detection
    const isVideo =
      channel === "youtube" ||
      channel === "podcast" ||
      !!extractOgTag(html, "video") ||
      !!html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']video/i);

    const content_type = detectContentType(charCount, isVideo, channel);
    const description = extractOgTag(html, "description") || "";

    const result: AnalysisResult = {
      title,
      channel,
      content_type,
      charCount,
      isVideo,
      description,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("URL analysis failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `분석 실패: ${message}` },
      { status: 500 }
    );
  }
}
