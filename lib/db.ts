import { createHash, randomBytes } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Helper to get the D1 Database instance
export function getDb() {
  return getCloudflareContext().env.DB;
}

export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export const token = () => randomBytes(32).toString("hex");

export async function transaction<T>(fn: (db: any) => Promise<T>): Promise<T> {
  const db = getDb();
  await db.exec("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    await db.exec("COMMIT");
    return result;
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }
}

export async function identity(cookie?: string) {
  if (!cookie) return undefined;
  const db = getDb();
  return (await db
    .prepare(
      "SELECT u.* FROM sessions s JOIN users u USING(email) WHERE s.id=? AND s.expires>?",
    )
    .bind(hash(cookie), Date.now())
    .first()) as { email: string; name: string; role: string; joined: string } | undefined;
}

export function day() {
  const start = process.env.COHORT_START;
  if (
    !start ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(Date.parse(start))
  )
    throw Error("Configure COHORT_START");
  return Math.max(
    0,
    Math.min(
      90,
      1 + Math.floor((Date.now() + 3600000 - Date.parse(start + "T00:00:00Z")) / 86400000),
    ),
  );
}