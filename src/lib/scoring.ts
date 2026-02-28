export type ContentType =
  | "original_long"
  | "original_video"
  | "original_mid"
  | "short_video"
  | "derivative"
  | "short";

export type Channel =
  | "blog"
  | "linkedin"
  | "x"
  | "podcast"
  | "youtube"
  | "other";

export const POINTS_MAP: Record<ContentType, number> = {
  original_long: 5,
  original_video: 5,
  original_mid: 3,
  short_video: 2,
  derivative: 1,
  short: 1,
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  original_long: "원본 장문 (5pt)",
  original_video: "원본 영상 (5pt)",
  original_mid: "원본 중문 (3pt)",
  short_video: "숏폼 영상 (2pt)",
  derivative: "파생 콘텐츠 (1pt)",
  short: "단문 (1pt)",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  blog: "Blog",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  podcast: "Podcast",
  youtube: "YouTube",
  other: "Other",
};

export const ORIGINAL_TYPES: ContentType[] = [
  "original_long",
  "original_video",
];

const SHORT_TYPES: ContentType[] = ["short"];
const SHORT_WEEKLY_CAP = 5;
const WEEKLY_MINIMUM = 15;
const YELLOW_CARD_THRESHOLD = 10;

export interface ContentItem {
  id: string;
  member: string;
  title: string;
  url?: string;
  channel: Channel;
  content_type: ContentType;
  points: number;
  published_at: string;
  source: "ghost_auto" | "manual_web" | "manual_claude";
  ghost_id?: string;
  is_original: boolean;
}

export interface WeeklyScore {
  member: string;
  week: string;
  total_points: number;
  original_count: number;
  meets_minimum: boolean;
  is_yellow_card: boolean;
  consecutive_miss: number;
}

export function getPoints(contentType: ContentType): number {
  return POINTS_MAP[contentType];
}

export function isOriginal(contentType: ContentType): boolean {
  return ORIGINAL_TYPES.includes(contentType);
}

export function calculateWeeklyScore(items: ContentItem[]): {
  total_points: number;
  original_count: number;
  meets_minimum: boolean;
  is_yellow_card: boolean;
  raw_points: number;
} {
  let shortPoints = 0;
  let otherPoints = 0;
  let originalCount = 0;

  for (const item of items) {
    if (SHORT_TYPES.includes(item.content_type)) {
      shortPoints += item.points;
    } else {
      otherPoints += item.points;
    }
    if (isOriginal(item.content_type)) {
      originalCount++;
    }
  }

  // Apply short content cap (max 5pt from short posts per week)
  const cappedShortPoints = Math.min(shortPoints, SHORT_WEEKLY_CAP);
  const totalPoints = otherPoints + cappedShortPoints;
  const rawPoints = otherPoints + shortPoints;

  return {
    total_points: totalPoints,
    original_count: originalCount,
    meets_minimum: totalPoints >= WEEKLY_MINIMUM,
    is_yellow_card: totalPoints < YELLOW_CARD_THRESHOLD,
    raw_points: rawPoints,
  };
}

export function getGrade(
  weeklyAvg: number,
  fulfillmentRate: number,
  originalRate: number
): "S" | "A" | "B" | "C" | "D" {
  if (fulfillmentRate >= 0.95 && weeklyAvg >= 25 && originalRate >= 0.4)
    return "S";
  if (fulfillmentRate >= 0.85 && weeklyAvg >= 20 && originalRate >= 0.35)
    return "A";
  if (fulfillmentRate >= 0.75 && weeklyAvg >= 15 && originalRate >= 0.3)
    return "B";
  if (fulfillmentRate >= 0.6 && weeklyAvg >= 12 && originalRate >= 0.2)
    return "C";
  return "D";
}

// Week utilities — ISO 8601 week number
export function getWeekString(date: Date): string {
  // UTC 기반으로 계산하여 timezone 영향 제거
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // ISO: Monday=1, Sunday=7. 목요일이 속한 연도가 해당 주의 연도
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export function getWeekDates(weekString: string): {
  start: Date;
  end: Date;
} {
  const [yearStr, weekStr] = weekString.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);

  // ISO week 1의 목요일 = 1월 4일이 속한 주
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Monday=1 ... Sunday=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export function getCurrentWeek(): string {
  return getWeekString(new Date());
}

export function getRecentWeeks(count: number): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const w = getWeekString(d);
    if (!weeks.includes(w)) weeks.push(w);
  }
  return weeks;
}
