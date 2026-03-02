import Airtable from "airtable";
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

function getBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable API key and Base ID are required. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID env vars.");
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

function contentTable() {
  return getBase()("ContentLog");
}

function scoresTable() {
  return getBase()("WeeklyScores");
}

// --- ContentLog ---

function recordToContent(record: Airtable.Record<Airtable.FieldSet>): ContentItem {
  return {
    id: record.id,
    member: record.get("member") as string,
    title: record.get("title") as string,
    url: (record.get("url") as string) || undefined,
    channel: record.get("channel") as Channel,
    content_type: record.get("content_type") as ContentType,
    points: (record.get("points") as number) || 0,
    published_at: record.get("published_at") as string,
    source: record.get("source") as ContentItem["source"],
    ghost_id: (record.get("ghost_id") as string) || undefined,
    is_original: (record.get("is_original") as boolean) || false,
    status: (record.get("status") as ContentStatus) || "published",
    topic: (() => {
      const raw = record.get("topic");
      if (!raw) return undefined;
      if (Array.isArray(raw)) return raw as Topic[];
      return [raw] as Topic[];
    })(),
    target_date: (record.get("target_date") as string) || undefined,
  };
}

export async function getContentByWeek(
  week: string,
  member?: string
): Promise<ContentItem[]> {
  const formula = member
    ? `AND({week}='${week}', {member}='${member}')`
    : `{week}='${week}'`;

  const records = await contentTable()
    .select({
      filterByFormula: formula,
      sort: [{ field: "published_at", direction: "desc" }],
    })
    .all();

  return records.map(recordToContent);
}

export async function getContentByDateRange(
  startDate: string,
  endDate: string,
  member?: string
): Promise<ContentItem[]> {
  let formula = `AND(IS_AFTER({published_at}, '${startDate}'), IS_BEFORE({published_at}, '${endDate}'), OR({status}='published', {status}=BLANK()))`;
  if (member) {
    formula = `AND(${formula}, {member}='${member}')`;
  }

  const records = await contentTable()
    .select({
      filterByFormula: formula,
      sort: [{ field: "published_at", direction: "desc" }],
    })
    .all();

  return records.map(recordToContent);
}

export async function addContent(
  data: Omit<ContentItem, "id" | "points" | "is_original" | "topic" | "target_date"> & { topic?: Topic[]; target_date?: string }
): Promise<ContentItem> {
  const status = data.status || "published";
  const points = status === "published" ? getPoints(data.content_type) : 0;
  const is_original_flag = status === "published" ? isOriginal(data.content_type) : false;

  const record = await contentTable().create({
    member: data.member,
    title: data.title,
    url: data.url || "",
    channel: data.channel,
    content_type: data.content_type,
    points,
    published_at: data.published_at,
    source: data.source,
    ghost_id: data.ghost_id || "",
    is_original: is_original_flag,
    status,
    ...(data.topic && data.topic.length > 0 ? { topic: data.topic } : {}),
    ...(data.target_date ? { target_date: data.target_date } : {}),
  });

  return recordToContent(record);
}

export async function getPipeline(): Promise<ContentItem[]> {
  const records = await contentTable()
    .select({
      filterByFormula: `{status}='idea'`,
      sort: [{ field: "published_at", direction: "desc" }],
    })
    .all();

  return records.map(recordToContent);
}

export async function getContentById(id: string): Promise<ContentItem> {
  const record = await contentTable().find(id);
  return recordToContent(record);
}

export async function updateContentStatus(
  id: string,
  status: ContentStatus
): Promise<ContentItem> {
  const record = await contentTable().update(id, { status });
  return recordToContent(record);
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
  }
): Promise<ContentItem> {
  const airtableFields: Partial<Airtable.FieldSet> = {};
  if (fields.title !== undefined) airtableFields.title = fields.title;
  if (fields.channel !== undefined) airtableFields.channel = fields.channel;
  if (fields.content_type !== undefined) airtableFields.content_type = fields.content_type;
  if (fields.status !== undefined) airtableFields.status = fields.status;
  if (fields.target_date !== undefined) airtableFields.target_date = fields.target_date || "";
  if (fields.topic !== undefined) airtableFields.topic = fields.topic.length > 0 ? fields.topic : [];

  const record = await contentTable().update(id, airtableFields);
  return recordToContent(record);
}

export async function checkGhostIdExists(ghostId: string): Promise<boolean> {
  const records = await contentTable()
    .select({
      filterByFormula: `{ghost_id}='${ghostId}'`,
      maxRecords: 1,
    })
    .all();

  return records.length > 0;
}

// --- WeeklyScores ---

function recordToScore(record: Airtable.Record<Airtable.FieldSet>): WeeklyScore {
  return {
    member: record.get("member") as string,
    week: record.get("week") as string,
    total_points: (record.get("total_points") as number) || 0,
    original_count: (record.get("original_count") as number) || 0,
    meets_minimum: (record.get("meets_minimum") as boolean) || false,
    is_yellow_card: (record.get("is_yellow_card") as boolean) || false,
    consecutive_miss: (record.get("consecutive_miss") as number) || 0,
  };
}

export async function getWeeklyScores(week: string): Promise<WeeklyScore[]> {
  const records = await scoresTable()
    .select({
      filterByFormula: `{week}='${week}'`,
    })
    .all();

  return records.map(recordToScore);
}

export async function getScoreHistory(
  member: string,
  weeks: number = 8
): Promise<WeeklyScore[]> {
  const records = await scoresTable()
    .select({
      filterByFormula: `{member}='${member}'`,
      sort: [{ field: "week", direction: "desc" }],
      maxRecords: weeks,
    })
    .all();

  return records.map(recordToScore);
}

export async function upsertWeeklyScore(
  score: Omit<WeeklyScore, "consecutive_miss"> & {
    consecutive_miss?: number;
  }
): Promise<WeeklyScore> {
  // Check if exists
  const existing = await scoresTable()
    .select({
      filterByFormula: `AND({member}='${score.member}', {week}='${score.week}')`,
      maxRecords: 1,
    })
    .all();

  const fields = {
    member: score.member,
    week: score.week,
    total_points: score.total_points,
    original_count: score.original_count,
    meets_minimum: score.meets_minimum,
    is_yellow_card: score.is_yellow_card,
    consecutive_miss: score.consecutive_miss || 0,
  };

  if (existing.length > 0) {
    const record = await scoresTable().update(existing[0].id, fields);
    return recordToScore(record);
  } else {
    const record = await scoresTable().create(fields);
    return recordToScore(record);
  }
}
