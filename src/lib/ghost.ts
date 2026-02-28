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

export async function fetchGhostPosts(): Promise<GhostPost[]> {
  const baseUrl = process.env.GHOST_API_BASE_URL;
  const apiKey = process.env.GHOST_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Ghost API not configured");
  }

  const response = await fetch(`${baseUrl}?key=${apiKey}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Ghost API returned ${response.status}`);
  }

  return response.json();
}

export async function fetchGhostPostsByBlog(
  blogId: string
): Promise<GhostPost[]> {
  const baseUrl = process.env.GHOST_API_BASE_URL;
  const apiKey = process.env.GHOST_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Ghost API not configured");
  }

  const response = await fetch(`${baseUrl}/${blogId}?key=${apiKey}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Ghost API returned ${response.status}`);
  }

  return response.json();
}
