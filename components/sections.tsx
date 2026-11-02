"use client";
import { useState } from "react";
import { Video, Download, Users } from "lucide-react";
import { ActionForm, Field, post } from "./forms";
import type { Snapshot, Item } from "@/lib/model";
export function LinkSection({ s }: { s: Snapshot }) {
  const [query, Q] = useState("");
  const meetings = s.items.filter((i) =>
      ["Meeting", "Stream"].includes(i.kind),
    ),
    people = s.items.filter(
      (i) =>
        ["Mentor", "Facilitator"].includes(i.kind) &&
        (i.title + " " + i.body + " " + i.kind)
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <section id="link" className="stack">
      <h2>01 / LINK</h2>
      <div className="gridpair">
        <div className="panel">
          <Video />
          <h3>Live room</h3>
          {meetings.length ? (
            meetings.map((m) => (
              <article className="rounded-xl bg-purple-50 p-4" key={m.id}>
                <h3>{m.title}</h3>
                {m.live && m.kind === "Stream" ? (
                  <video
                    controls
                    playsInline
                    preload="none"
                    className="aspect-video w-full rounded-lg bg-ink"
                    src={m.body}
                    aria-label={m.title}
                  />
                ) : m.live ? (
                  <a
                    className="button"
                    href={m.body}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join live meeting
                  </a>
                ) : (
                  <p>Room closed</p>
                )}
              </article>
            ))
          ) : (
            <p>The next live meeting will appear here.</p>
          )}
        </div>
        <aside className="panel">
          <h3>Cohort chat</h3>
          <ol className="max-h-64 space-y-2 overflow-y-auto">
            {s.messages.map((m) => (
              <li className="break-words" key={m.id}>
                <strong>{m.name}</strong>
                <p>{m.body}</p>
              </li>
            ))}
          </ol>
          {!s.messages.length && <p>Start your circle’s first conversation.</p>}
          <ActionForm
            label="Send message"
            reset
            run={(f) => post("chat", { body: f.get("body") })}
          >
            <label>
              Message
              <textarea name="body" required maxLength={500} />
            </label>
          </ActionForm>
        </aside>
      </div>
      <div className="panel">
        <Users />
        <h3>Mentors and facilitators</h3>
        <label>
          Search name, role or specialty
          <input
            type="search"
            value={query}
            onChange={(e) => Q(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <article className="rounded-xl bg-stone-50 p-4" key={p.id}>
              <p className="eyebrow">{p.kind}</p>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
        {!people.length && <p>No matching profiles.</p>}
      </div>
    </section>
  );
}
function Worksheet({ item }: { item: Item }) {
  const [msg, M] = useState("");
  return (
    <div className="border-t py-3">
      <p>{item.title}</p>
      <div className="flex flex-wrap gap-4">
        <a href={"/api/worksheet/" + item.id}>Download PDF</a>
        <button
          className="inline-flex items-center gap-1"
          onClick={async () => {
            try {
              const r = await fetch("/api/worksheet/" + item.id);
              if (!r.ok) throw Error();
              const cache = await caches.open("moremi-personal");
              await cache.put(
                "/member/saved/" + item.id,
                new Response(await r.blob(), {
                  headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition":
                      'attachment; filename="worksheet.pdf"',
                    "X-Moremi-Title": encodeURIComponent(item.title),
                  },
                }),
              );
              M("Saved on this device.");
            } catch {
              M("Unable to save. Check your connection and device storage.");
            }
          }}
        >
          <Download size={16} /> Save offline
        </button>
      </div>
      <small role="status">{msg}</small>
    </div>
  );
}
export function LearnSection({ items }: { items: Item[] }) {
  return (
    <section id="learn" className="stack">
      <h2>02 / LEARN</h2>
      <div className="gridpair">
        {(["Seminar", "Founder"] as const).map((kind) => (
          <div key={kind} className="panel">
            <h3>
              {kind === "Founder" ? "Founders’ room" : "Seminar recordings"}
            </h3>
            {items
              .filter((i) => i.kind === kind)
              .map((i) => (
                <figure key={i.id}>
                  <video
                    className="aspect-video w-full rounded-lg bg-ink"
                    preload="none"
                    controls
                    src={i.body}
                  />
                  <figcaption>{i.title}</figcaption>
                </figure>
              ))}
            {!items.some((i) => i.kind === kind) && (
              <p>Recordings will appear after publication.</p>
            )}
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>Worksheet library</h3>
        <p>
          Save worksheets only on a personal device. Anyone using this browser
          profile can open saved copies offline.
        </p>
        <a href="/member/offline.html">Open saved worksheets</a>
        {items
          .filter((i) => i.kind === "Worksheet")
          .map((i) => (
            <Worksheet key={i.id} item={i} />
          ))}
        {!items.some((i) => i.kind === "Worksheet") && (
          <p>No worksheets published yet.</p>
        )}
      </div>
    </section>
  );
}
export function LeadSection({ s }: { s: Snapshot }) {
  const [file, F] = useState<File | null>(null),
    [drag, D] = useState(false);
  const p = s.projects[0],
    open = s.progress.includes("LEARN") && (!p || p.status === "revise");
  return (
    <section className="panel" id="lead">
      <p className="eyebrow">03 / LEAD</p>
      <h2>Your community case study</h2>
      <p>
        Describe the challenge, what you did, who benefited and what you
        learned. Include evidence you have permission to share.
      </p>
      {p && (
        <p>
          <strong>{p.title}</strong> · {p.status}{" "}
          {p.feedback && "— " + p.feedback}
        </p>
      )}
      {open ? (
        <ActionForm
          label="Submit for expert review"
          success="Submitted for review."
          run={async (f) => {
            if (!file) throw Error("Select a PDF.");
            f.set("file", file);
            await post("project", f);
            F(null);
          }}
        >
          <Field name="title" label="Project title" />
          <label
            className={
              "rounded-xl border-2 border-dashed p-6 " +
              (drag ? "bg-purple-100" : "")
            }
            onDragOver={(e) => {
              e.preventDefault();
              D(true);
            }}
            onDragLeave={() => D(false)}
            onDrop={(e) => {
              e.preventDefault();
              D(false);
              F(e.dataTransfer.files[0] || null);
            }}
          >
            Drop a PDF or choose a file · 5 MB maximum
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => F(e.target.files?.[0] || null)}
            />
            {file?.name}
          </label>
        </ActionForm>
      ) : (
        <p>
          {p
            ? "Your review status updates here."
            : "Your facilitator unlocks submission after verifying LINK and LEARN."}
        </p>
      )}
    </section>
  );
}
