import { NextRequest, NextResponse } from "next/server";
import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDb, day, identity, hash, token, transaction } from "@/lib/db";
import { kinds } from "@/lib/model";
import { send } from "@/lib/mail";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class Failure extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}
function reject(status: number, msg: string): never { throw new Failure(status, msg); }

const email = z.string().trim().email().max(254).toLowerCase();
const short = z.string().trim().min(1).max(120);
const note = z.string().trim().min(1).max(500);
const answer = z.object({
  name: short, email, birth: z.iso.date(), city: short, goal: note,
  stage: short, availability: short, contribution: note, agreement: z.literal("yes"),
});

async function limit(db: any, key: string, max: number) {
  const now = Date.now();
  const row = await db
    .prepare(
      "INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count",
    )
    .bind(hash(key), now + 900000, now, now)
    .first();
  if (Number(row.count) > max) reject(429, "Too many attempts. Try again in 15 minutes.");
}

function proof(id: string, code: string) {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 32) throw Error("Set OTP_SECRET");
  return createHmac("sha256", secret).update(id + code).digest("hex");
}

async function session(req: NextRequest) {
  return identity(req.cookies.get("moremi")?.value);
}

async function snapshot(db: any, u: any) {
  const admin = u.role === "admin";
  const members = admin
    ? (await db.prepare("SELECT u.name,u.email,COALESCE(group_concat(m.stage),'') done FROM users u LEFT JOIN milestones m USING(email) WHERE role='member' GROUP BY u.email").all()).results
    : [];
    
  return {
    name: u.name,
    day: day(),
    items: (await db.prepare("SELECT id,kind,title,CASE WHEN ?=0 AND live=0 AND kind IN ('Meeting','Stream') THEN '' ELSE body END body,live FROM content ORDER BY id DESC").bind(admin ? 1 : 0).all()).results,
    messages: (await db.prepare("SELECT * FROM (SELECT m.id,u.name,m.body FROM messages m JOIN users u USING(email) ORDER BY m.id DESC LIMIT 80) ORDER BY id").all()).results,
    progress: (await db.prepare("SELECT stage FROM milestones WHERE email=?").bind(u.email).all()).results.map((r: any) => r.stage),
    projects: admin
      ? (await db.prepare("SELECT id,title,status,feedback,email FROM projects").all()).results
      : (await db.prepare("SELECT id,title,status,feedback FROM projects WHERE email=?").bind(u.email).all()).results,
    applicants: admin
      ? (await db.prepare("SELECT email,name,status,answers FROM applications ORDER BY rowid DESC").all()).results
      : [],
    members,
    metrics: ["LINK", "LEARN", "LEAD"].map(
      (stage) => members.filter((m: any) => String(m.done).split(",").includes(stage)).length,
    ),
  };
}

async function upload(req: NextRequest, db: any) {
  if (Number(req.headers.get("content-length")) > 6 * 1024 * 1024) reject(413, "Maximum PDF size is 5 MB.");
  const f = await req.formData(), file = f.get("file"), title = short.parse(f.get("title"));
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024) reject(400, "Choose a PDF under 5 MB.");
  
  const bytes = await file.arrayBuffer();
  if (new Uint8Array(bytes).subarray(0, 5).toString() !== "%PDF-") reject(400, "A PDF is required.");
  
  const key = token();
  // FIX: Added type cast here
  const { env } = getCloudflareContext() as { env: CloudflareEnv };
  await env.R2.put(key, bytes, { httpMetadata: { contentType: "application/pdf" } });
  
  return { key, title, id: Number(f.get("id") || 0) };
}

async function handle(req: NextRequest, path: string) {
  const db = getDb();
  const u = await session(req), admin = u?.role === "admin", now = Date.now();

  if (req.method === "GET") {
    if (!u) reject(401, "Sign in again.");
    if (path === "state") return await snapshot(db, u);
    if (path === "changes") {
      const reader = new DatabaseObserver(req.signal, u.email, req.cookies.get("moremi")!.value);
      return new Response(reader.stream(), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "private, no-store", "X-Accel-Buffering": "no" } });
    }
    const match = /^(worksheet|project)\/(\d+)$/.exec(path);
    if (match) {
      const id = Number(match[2]);
      const row: any = match[1] === "worksheet"
        ? await db.prepare("SELECT file FROM content WHERE id=? AND kind='Worksheet'").bind(id).first()
        : await db.prepare("SELECT file FROM projects WHERE id=? AND (email=? OR ?=1)").bind(id, u.email, admin ? 1 : 0).first();
      
      if (!row) reject(404, "File unavailable.");
      // FIX: Added type cast here
      const { env } = getCloudflareContext() as { env: CloudflareEnv };
      const obj = await env.R2.get(row.file);
      if (!obj) reject(404, "File missing.");
      
      return new Response(obj.body, {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="moremi-document.pdf"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
      });
    }
    reject(404, "Unknown resource.");
  }

  if (req.headers.get("origin") !== new URL(process.env.APP_ORIGIN || req.url).origin) reject(403, "Invalid request origin.");
  
  const data = async () => {
    if (!req.headers.get("content-type")?.includes("application/json")) reject(415, "JSON required.");
    const raw = await req.text();
    if (raw.length > 16000) reject(413, "Request too large.");
    return JSON.parse(raw);
  };

  if (path === "apply/code") {
    const e = email.parse((await data()).email), id = token(), code = String(randomInt(1000000)).padStart(6, "0");
    await limit(db, "appcode" + e, 4);
    await db.prepare("INSERT INTO challenges(id,email,proof,invite,expires) VALUES(?,?,?,?,?)").bind(id, e, proof(id, code), "application", now + 600000).run();
    await send(e, "Verify your Moremi application email", code + " is your application verification code. It expires in ten minutes.");
    return { id };
  }

  if (path === "lead" || path === "apply") {
    const b = await data(), e = email.parse(b.email);
    await limit(db, path + e, 8);
    if (path === "lead") {
      await db.prepare("INSERT OR IGNORE INTO leads VALUES(?,?)").bind(e, short.parse(b.name)).run();
      return {};
    }
    const a = answer.parse(b), start = process.env.COHORT_START!;
    day();
    const age = Number(start.slice(0, 4)) - Number(a.birth.slice(0, 4)) - (start.slice(5) < a.birth.slice(5) ? 1 : 0);
    if (age < 18 || age > 35) reject(422, "Applicants must be 18–35 at the cohort start.");
    
    const id = z.string().length(64).parse(b.challenge), code = z.string().regex(/^\d{6}$/).parse(b.code);
    const challenge: any = await db.prepare("UPDATE challenges SET tries=tries+1 WHERE id=? AND email=? AND invite='application' AND expires>? AND tries<5 RETURNING proof").bind(id, e, now).first();
    
    if (!challenge || !timingSafeEqual(Buffer.from(String(challenge.proof)), Buffer.from(proof(id, code)))) reject(403, "Invalid or expired application code.");
    
    await transaction(async (tx) => {
      await tx.prepare("DELETE FROM challenges WHERE id=?").bind(id).run();
      await tx.prepare("INSERT OR IGNORE INTO applications(email,name,answers) VALUES(?,?,?)").bind(e, a.name, JSON.stringify(a)).run();
    });
    return {};
  }

  if (path === "auth/request") {
    const b = await data(), e = email.parse(b.email), inv = hash(z.string().max(100).parse(b.token || "")), id = token();
    await limit(db, "otp" + e, 5);
    const invited: any = await db.prepare("SELECT 1 FROM applications WHERE email=? AND status='invited' AND invite=? AND expires>?").bind(e, inv, now).first();
    const user: any = await db.prepare("SELECT 1 FROM users WHERE email=?").bind(e).first();
    if (invited || user) {
      const code = String(randomInt(1000000)).padStart(6, "0");
      await db.prepare("INSERT INTO challenges(id,email,proof,invite,expires) VALUES(?,?,?,?,?)").bind(id, e, proof(id, code), invited ? inv : null, now + 600000).run();
      await send(e, "Your Moremi sign-in code", code + " is your code. It expires in ten minutes.");
    }
    return { id };
  }

  if (path === "auth/verify") {
    const b = await data(), id = z.string().length(64).parse(b.id), code = z.string().regex(/^\d{6}$/).parse(b.code);
    const r: any = await db.prepare("UPDATE challenges SET tries=tries+1 WHERE id=? AND (invite IS NULL OR invite!='application') AND expires>? AND tries<5 RETURNING *").bind(id, now).first();
    if (!r || !timingSafeEqual(Buffer.from(String(r.proof)), Buffer.from(proof(id, code)))) reject(403, "Invalid or expired code.");
    
    const sid = token();
    const role = await transaction(async (tx) => {
      if (!(await tx.prepare("DELETE FROM challenges WHERE id=?").bind(id).run()).meta.changes) reject(403, "Code already used.");
      if (r.invite) {
        const a: any = await tx.prepare("UPDATE applications SET status='active',invite=NULL WHERE email=? AND status='invited' AND invite=? AND expires>? RETURNING name").bind(r.email, r.invite, now).first();
        if (!a) reject(403, "Invitation expired or replaced.");
        await tx.prepare("INSERT INTO users VALUES(?,?,'member',?)").bind(r.email, a.name, new Date().toISOString()).run();
      }
      const person: any = await tx.prepare("SELECT role FROM users WHERE email=?").bind(r.email).first();
      if (!person) reject(403, "Access denied.");
      await tx.prepare("INSERT INTO sessions VALUES(?,?,?)").bind(hash(sid), r.email, now + 43200000).run();
      return person.role;
    });

    const res = NextResponse.json({ role });
    res.cookies.set("moremi", sid, { httpOnly: true, sameSite: "strict", secure: process.env.APP_ORIGIN?.startsWith("https://"), path: "/", maxAge: 43200 });
    return res;
  }

  if (!u) reject(401, "Sign in again.");
  
  if (path === "logout") {
    await db.prepare("DELETE FROM sessions WHERE id=?").bind(hash(req.cookies.get("moremi")!.value)).run();
    const res = NextResponse.json({});
    res.cookies.delete("moremi");
    return res;
  }
  
  if (path === "chat") {
    await limit(db, "chat" + u.email, 60);
    await db.prepare("INSERT INTO messages(email,body) VALUES(?,?)").bind(u.email, note.parse((await data()).body)).run();
    return {};
  }
  
  if (path === "project") {
    if (admin || !(await db.prepare("SELECT 1 FROM milestones WHERE email=? AND stage='LEARN'").bind(u.email).first())) reject(403, "Complete LEARN before submitting.");
    const f = await upload(req, db);
    await db.prepare("INSERT INTO projects(email,title,file) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET title=excluded.title,file=excluded.file,status='submitted',feedback='' WHERE projects.status='revise'").bind(u.email, f.title, f.key).run();
    return {};
  }

  if (!admin) reject(403, "Staff access required.");
  
  if (path === "admin/worksheet") {
    const f = await upload(req, db);
    if (f.id) await db.prepare("UPDATE content SET title=?,file=? WHERE id=? AND kind='Worksheet'").bind(f.title, f.key, f.id).run();
    else await db.prepare("INSERT INTO content(kind,title,body,file) VALUES('Worksheet',?,'',?)").bind(f.title, f.key).run();
    return {};
  }

  const b = await data();
  if (path === "admin/decision") {
    const e = email.parse(b.email), decision = z.enum(["invite", "decline"]).parse(b.decision), raw = token();
    await db.prepare("UPDATE applications SET status=?,invite=?,expires=? WHERE email=? AND status IN ('submitted','invited','declined')").bind(decision === "invite" ? "invited" : "declined", decision === "invite" ? hash(raw) : null, now + 72 * 3600000, e).run();
    if (decision === "invite") await send(e, "Your Moremi Movement invitation", "Open " + process.env.APP_ORIGIN + "/activate and enter this invitation token: " + raw + " . It expires in 72 hours.");
    return {};
  }

  if (path === "admin/content") {
    const kind = z.enum(kinds).exclude(["Worksheet"]).parse(b.kind), title = short.parse(b.title), body = note.parse(b.body), live = ["Meeting", "Stream"].includes(kind) && b.live === true ? 1 : 0;
    if (["Meeting", "Stream", "Founder", "Seminar"].includes(kind) && !/^https:\/\//.test(z.url().parse(body))) reject(422, "Use an HTTPS media or meeting URL.");
    if (b.id) await db.prepare("UPDATE content SET kind=?,title=?,body=?,live=? WHERE id=? AND kind!='Worksheet'").bind(kind, title, body, live, z.number().int().parse(b.id)).run();
    else await db.prepare("INSERT INTO content(kind,title,body,live) VALUES(?,?,?,?)").bind(kind, title, body, live).run();
    return {};
  }

  if (path === "admin/milestone") {
    const e = email.parse(b.email), stage = z.enum(["LINK", "LEARN"]).parse(b.stage);
    if (!(await db.prepare("SELECT 1 FROM users WHERE email=? AND role='member'").bind(e).first())) reject(404, "Member unavailable.");
    if (stage === "LEARN" && !(await db.prepare("SELECT 1 FROM milestones WHERE email=? AND stage='LINK'").bind(e).first())) reject(409, "Verify LINK first.");
    await db.prepare("INSERT OR IGNORE INTO milestones VALUES(?,?)").bind(e, stage).run();
    return {};
  }

  if (path === "admin/review") {
    const status = z.enum(["approved", "revise"]).parse(b.status), feedback = note.parse(b.feedback);
    await transaction(async (tx) => {
      const p: any = await tx.prepare("UPDATE projects SET status=?,feedback=? WHERE id=? AND status='submitted' RETURNING email").bind(status, feedback, z.number().int().parse(b.id)).first();
      if (!p) reject(409, "Review already recorded.");
      if (status === "approved") await tx.prepare("INSERT OR IGNORE INTO milestones VALUES(?,'LEAD')").bind(p.email).run();
    });
    return {};
  }

  reject(404, "Unknown action.");
}

class DatabaseObserver {
  constructor(private signal: AbortSignal, private email: string, private sid: string) {}
  stream() {
    let stop = () => {};
    return new ReadableStream({
      start: async (controller) => {
        const db = getDb();
        let beats = 0, closed = false;
        const tick = async () => {
          if (!(await identity(this.sid))) { stop(); return; }
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
          if (++beats >= 30) stop();
        };
        const timer = setInterval(tick, 2000);
        stop = () => {
          if (closed) return;
          closed = true;
          clearInterval(timer);
          this.signal.removeEventListener("abort", stop);
          controller.close();
        };
        this.signal.addEventListener("abort", stop, { once: true });
        await tick();
      },
      cancel: () => stop(),
    });
  }
}

type Context = { params: Promise<{ path: string[] }> };
async function route(req: NextRequest, ctx: Context) {
  try {
    const value = await handle(req, (await ctx.params).path.join("/"));
    const res = value instanceof Response ? value : NextResponse.json(value);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    const input = e instanceof z.ZodError || e instanceof SyntaxError;
    return NextResponse.json(
      { error: e instanceof Failure ? e.message : input ? "Check the entered fields." : "Service unavailable. Try again or contact programme staff." },
      { status: e instanceof Failure ? e.status : input ? 422 : 503 }
    );
  }
}
export { route as GET, route as POST };