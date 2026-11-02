import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
const address = process.argv[2]?.trim().toLowerCase();
if (!address || !/^\S+@\S+\.\S+$/.test(address))
  throw Error("Usage: npm run setup -- admin@example.org");
if (!existsSync(".env.local"))
  writeFileSync(
    ".env.local",
    readFileSync(".env.example", "utf8")
      .replace("GENERATE_SECRET", randomBytes(32).toString("hex"))
      .replace("START_DATE", new Date().toISOString().slice(0, 10)),
    { mode: 0o600 },
  );
process.loadEnvFile(".env.local");
const dir = resolve(process.env.DATA_DIR || ".data");
mkdirSync(dir, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(resolve(dir, "moremi.sqlite"));
db.exec(
  "CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY,name TEXT,role TEXT,joined TEXT)",
);
db.prepare(
  "INSERT INTO users VALUES(?,'Programme staff','admin',?) ON CONFLICT(email) DO UPDATE SET role='admin'",
).run(address, new Date().toISOString());
db.close();
console.log(
  "Staff account ready. Configure the cohort date and SMTP in .env.local before launch.",
);
