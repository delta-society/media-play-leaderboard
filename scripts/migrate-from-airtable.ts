/**
 * Airtable → Supabase Migration Script
 *
 * Usage: npx tsx scripts/migrate-from-airtable.ts
 *
 * Requires both Airtable and Supabase env vars in .env.local:
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import Airtable from "airtable";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateContentLog() {
  console.log("--- Migrating ContentLog ---");

  const records = await airtable("ContentLog").select().all();
  console.log(`Airtable ContentLog: ${records.length} records`);

  if (records.length === 0) {
    console.log("No records to migrate.");
    return 0;
  }

  const rows = records.map((r) => {
    const topic = r.get("topic");
    let topicArray: string[] = [];
    if (topic) {
      topicArray = Array.isArray(topic) ? (topic as string[]) : [topic as string];
    }

    return {
      member: r.get("member") as string,
      title: r.get("title") as string,
      url: (r.get("url") as string) || null,
      channel: (r.get("channel") as string) || "other",
      content_type: (r.get("content_type") as string) || "original_long",
      points: (r.get("points") as number) || 0,
      published_at: (r.get("published_at") as string) || null,
      source: (r.get("source") as string) || null,
      ghost_id: (r.get("ghost_id") as string) || null,
      is_original: (r.get("is_original") as boolean) || false,
      status: (r.get("status") as string) || "published",
      topic: topicArray,
      target_date: (r.get("target_date") as string) || null,
    };
  });

  // Bulk insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("content_log").insert(batch);
    if (error) {
      console.error(`Error inserting batch at offset ${i}:`, error);
      throw error;
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${rows.length}`);
  }

  // Verify count
  const { count, error: countError } = await supabase
    .from("content_log")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  console.log(`Supabase content_log: ${count} records`);
  if (count !== records.length) {
    console.warn(`⚠ Count mismatch! Airtable: ${records.length}, Supabase: ${count}`);
  } else {
    console.log(`✓ Count verified: ${count}`);
  }
  return count || 0;
}

async function migrateWeeklyScores() {
  console.log("\n--- Migrating WeeklyScores ---");

  const records = await airtable("WeeklyScores").select().all();
  console.log(`Airtable WeeklyScores: ${records.length} records`);

  if (records.length === 0) {
    console.log("No records to migrate.");
    return 0;
  }

  const rows = records.map((r) => ({
    member: r.get("member") as string,
    week: r.get("week") as string,
    total_points: (r.get("total_points") as number) || 0,
    original_count: (r.get("original_count") as number) || 0,
    meets_minimum: (r.get("meets_minimum") as boolean) || false,
    is_yellow_card: (r.get("is_yellow_card") as boolean) || false,
    consecutive_miss: (r.get("consecutive_miss") as number) || 0,
  }));

  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("weekly_scores").insert(batch);
    if (error) {
      console.error(`Error inserting batch at offset ${i}:`, error);
      throw error;
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${rows.length}`);
  }

  // Verify count
  const { count, error: countError } = await supabase
    .from("weekly_scores")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  console.log(`Supabase weekly_scores: ${count} records`);
  if (count !== records.length) {
    console.warn(`⚠ Count mismatch! Airtable: ${records.length}, Supabase: ${count}`);
  } else {
    console.log(`✓ Count verified: ${count}`);
  }
  return count || 0;
}

async function main() {
  console.log("=== Airtable → Supabase Migration ===\n");

  try {
    const contentCount = await migrateContentLog();
    const scoreCount = await migrateWeeklyScores();

    console.log("\n=== Migration Complete ===");
    console.log(`Content records: ${contentCount}`);
    console.log(`Score records: ${scoreCount}`);
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  }
}

main();
