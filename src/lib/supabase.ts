import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  type ContentItem,
  type ContentStatus,
  type WeeklyScore,
  type ContentType,
  type Channel,
  type Topic,
  getPoints,
  isOriginal,
} from "./scoring";

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }
  return createClient(url, key);
}

// --- Row → Domain types ---

interface ContentRow {
  id: string;
  member: string;
  title: string;
  url: string | null;
  channel: Channel;
  content_type: ContentType;
  points: number;
  published_at: string | null;
  source: ContentItem["source"] | null;
  ghost_id: string | null;
  is_original: boolean;
  status: ContentStatus;
  topic: Topic[] | null;
  target_date: string | null;
  source_meeting_id: string | null;
  full_text: string | null;
  summary: string | null;
  key_claims: string[] | null;
  extracted_at: string | null;
}

function rowToContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    member: row.member,
    title: row.title,
    url: row.url || undefined,
    channel: row.channel,
    content_type: row.content_type,
    points: row.points || 0,
    published_at: row.published_at || "",
    source: row.source as ContentItem["source"],
    ghost_id: row.ghost_id || undefined,
    is_original: row.is_original || false,
    status: row.status || "published",
    topic: row.topic && row.topic.length > 0 ? row.topic : undefined,
    target_date: row.target_date || undefined,
    source_meeting_id: row.source_meeting_id || undefined,
    full_text: row.full_text || undefined,
    summary: row.summary || undefined,
    key_claims: row.key_claims && row.key_claims.length > 0 ? row.key_claims : undefined,
    extracted_at: row.extracted_at || undefined,
  };
}

interface ScoreRow {
  member: string;
  week: string;
  total_points: number;
  original_count: number;
  meets_minimum: boolean;
  is_yellow_card: boolean;
  consecutive_miss: number;
}

function rowToScore(row: ScoreRow): WeeklyScore {
  return {
    member: row.member,
    week: row.week,
    total_points: row.total_points || 0,
    original_count: row.original_count || 0,
    meets_minimum: row.meets_minimum || false,
    is_yellow_card: row.is_yellow_card || false,
    consecutive_miss: row.consecutive_miss || 0,
  };
}

// --- ContentLog ---

export async function getContentByWeek(
  week: string,
  member?: string
): Promise<ContentItem[]> {
  // week is a computed value (ISO week from published_at)
  // We need to calculate the date range for the given week and query by date
  const { getWeekDates } = await import("./scoring");
  const { start, end } = getWeekDates(week);
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const supabase = getClient();
  let query = supabase
    .from("content_log")
    .select("*")
    .gte("published_at", startStr)
    .lte("published_at", endStr)
    .order("published_at", { ascending: false });

  if (member) {
    query = query.eq("member", member);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(rowToContent);
}

export async function getContentByDateRange(
  startDate: string,
  endDate: string,
  member?: string
): Promise<ContentItem[]> {
  const supabase = getClient();
  let query = supabase
    .from("content_log")
    .select("*")
    .gte("published_at", startDate)
    .lte("published_at", endDate)
    .or("status.eq.published,status.is.null")
    .order("published_at", { ascending: false });

  if (member) {
    query = query.eq("member", member);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(rowToContent);
}

export async function addContent(
  data: Omit<ContentItem, "id" | "points" | "is_original" | "topic" | "target_date" | "source_meeting_id"> & {
    topic?: Topic[];
    target_date?: string;
    source_meeting_id?: string;
  }
): Promise<ContentItem> {
  const status = data.status || "published";
  const points = status === "published" ? getPoints(data.content_type) : 0;
  const is_original_flag =
    status === "published" ? isOriginal(data.content_type) : false;

  const supabase = getClient();
  const { data: row, error } = await supabase
    .from("content_log")
    .insert({
      member: data.member,
      title: data.title,
      url: data.url || null,
      channel: data.channel,
      content_type: data.content_type,
      points,
      published_at: data.published_at || null,
      source: data.source,
      ghost_id: data.ghost_id || null,
      is_original: is_original_flag,
      status,
      topic: data.topic && data.topic.length > 0 ? data.topic : [],
      target_date: data.target_date || null,
      source_meeting_id: data.source_meeting_id || null,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToContent(row);
}

export async function getPipeline(): Promise<ContentItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .select("*")
    .eq("status", "idea")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToContent);
}

export async function getContentById(id: string): Promise<ContentItem> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return rowToContent(data);
}

export async function updateContentStatus(
  id: string,
  status: ContentStatus
): Promise<ContentItem> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return rowToContent(data);
}

export async function updateContent(
  id: string,
  fields: {
    title?: string;
    channel?: Channel;
    content_type?: ContentType;
    status?: ContentStatus;
    target_date?: string;
    topic?: Topic[];
    source_meeting_id?: string;
  }
): Promise<ContentItem> {
  const updateFields: Record<string, unknown> = {};
  if (fields.title !== undefined) updateFields.title = fields.title;
  if (fields.channel !== undefined) updateFields.channel = fields.channel;
  if (fields.content_type !== undefined)
    updateFields.content_type = fields.content_type;
  if (fields.status !== undefined) updateFields.status = fields.status;
  if (fields.target_date !== undefined)
    updateFields.target_date = fields.target_date || null;
  if (fields.topic !== undefined)
    updateFields.topic = fields.topic.length > 0 ? fields.topic : [];
  if (fields.source_meeting_id !== undefined)
    updateFields.source_meeting_id = fields.source_meeting_id || null;

  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return rowToContent(data);
}

export async function updateExtraction(
  id: string,
  fields: {
    full_text: string;
    summary: string;
    key_claims: string[];
  }
): Promise<ContentItem> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .update({
      full_text: fields.full_text,
      summary: fields.summary,
      key_claims: fields.key_claims,
      extracted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return rowToContent(data);
}

export async function getUnextractedContent(): Promise<ContentItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .select("*")
    .eq("status", "published")
    .is("full_text", null)
    .in("channel", ["blog", "linkedin", "podcast"])
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToContent);
}

export async function getAllPublishedContent(options?: {
  member?: string;
  channel?: string;
  topic?: string;
  search?: string;
}): Promise<ContentItem[]> {
  const supabase = getClient();
  let query = supabase
    .from("content_log")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (options?.member) query = query.eq("member", options.member);
  if (options?.channel) query = query.eq("channel", options.channel);
  if (options?.topic) query = query.contains("topic", [options.topic]);
  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,summary.ilike.%${options.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(rowToContent);
}

// --- MemberInsights ---

export interface MemberInsight {
  member: string;
  suggestions: {
    type: "unfurled" | "emotion" | "data";
    text: string;
    source_title: string;
  }[];
  generated_at: string;
}

export async function getMemberInsights(member?: string): Promise<MemberInsight[]> {
  const supabase = getClient();
  let query = supabase.from("member_insights").select("*");
  if (member) query = query.eq("member", member);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MemberInsight[];
}

export async function upsertMemberInsights(
  member: string,
  suggestions: MemberInsight["suggestions"]
): Promise<MemberInsight> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("member_insights")
    .upsert(
      {
        member,
        suggestions,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "member" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as MemberInsight;
}

export async function checkGhostIdExists(ghostId: string): Promise<boolean> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("content_log")
    .select("id")
    .eq("ghost_id", ghostId)
    .limit(1);

  if (error) throw error;
  return (data || []).length > 0;
}

// --- WeeklyScores ---

export async function getWeeklyScores(week: string): Promise<WeeklyScore[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("weekly_scores")
    .select("*")
    .eq("week", week);

  if (error) throw error;
  return (data || []).map(rowToScore);
}

export async function getScoreHistory(
  member: string,
  weeks: number = 8
): Promise<WeeklyScore[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("weekly_scores")
    .select("*")
    .eq("member", member)
    .order("week", { ascending: false })
    .limit(weeks);

  if (error) throw error;
  return (data || []).map(rowToScore);
}

export async function upsertWeeklyScore(
  score: Omit<WeeklyScore, "consecutive_miss"> & {
    consecutive_miss?: number;
  }
): Promise<WeeklyScore> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("weekly_scores")
    .upsert(
      {
        member: score.member,
        week: score.week,
        total_points: score.total_points,
        original_count: score.original_count,
        meets_minimum: score.meets_minimum,
        is_yellow_card: score.is_yellow_card,
        consecutive_miss: score.consecutive_miss || 0,
      },
      { onConflict: "member,week" }
    )
    .select()
    .single();

  if (error) throw error;
  return rowToScore(data);
}
