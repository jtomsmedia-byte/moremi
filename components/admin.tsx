"use client";
import { useState } from "react";
import { ActionForm, Field, post } from "./forms";
import { kinds, stages, type Snapshot, type Item, type Kind } from "@/lib/model";
import { Users, FileText, CheckCircle, ChevronDown } from "lucide-react";

function ContentEditor({ item }: { item?: Item }) {
  const [kind, K] = useState<Kind>(item?.kind || "Seminar");
  return (
    <ActionForm
      label={item ? "Update item" : "Publish to cohort"}
      success="Content saved."
      run={(f) => {
        if (kind === "Worksheet") {
          f.set("id", String(item?.id || 0));
          return post("admin/worksheet", f);
        }
        return post("admin/content", {
          id: item?.id,
          title: f.get("title"),
          kind,
          body: f.get("body"),
          live: f.has("live"),
        });
      }}
    >
      <div className="space-y-4 pt-2">
        <label>
          Content type
          <select
            value={kind}
            disabled={!!item}
            onChange={(e) => K(e.target.value as Kind)}
          >
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Title or name
          <input name="title" required maxLength={120} defaultValue={item?.title} />
        </label>
        {kind === "Worksheet" ? (
          <label>
            Worksheet PDF
            <input type="file" name="file" accept="application/pdf" required />
          </label>
        ) : (
          <label>
            {["Mentor", "Facilitator"].includes(kind)
              ? "Specialty and bio"
              : kind === "Meeting"
                ? "HTTPS meeting URL"
                : "HTTPS video playback URL"}
            <input name="body" defaultValue={item?.body} required maxLength={500} />
          </label>
        )}
        {["Meeting", "Stream"].includes(kind) && (
          <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 cursor-pointer">
            <input
              className="h-5 w-5 rounded border-stone-300 text-plum focus:ring-plum"
              type="checkbox"
              name="live"
              defaultChecked={!!item?.live}
            />
            <span className="font-semibold text-stone-700">Open live room</span>
          </label>
        )}
      </div>
    </ActionForm>
  );
}

export function Admin({ s }: { s: Snapshot }) {
  const [edit, E] = useState(0);
  
  return (
    <div className="space-y-8">
      {/* Cohort Completion Counters */}
      <section className="rounded-[2rem] bg-white p-6 shadow-xl border border-stone-200/60 sm:p-8">
        <div className="flex items-center gap-3 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/5 text-plum">
            <Users size={20} />
          </div>
          <h2 className="text-2xl font-serif text-plum m-0">Cohort Completion</h2>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          {stages.map((x, i) => (
            <div key={x.name} className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm transition-all hover:border-plum/20 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold uppercase tracking-widest text-stone-500">{x.name}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm font-bold text-plum text-xs">
                  {s.metrics[i]}
                </span>
              </div>
              
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-serif font-bold text-plum">{s.metrics[i]}</span>
                <span className="mb-1 text-sm font-bold text-stone-400">/ {s.members.length} members</span>
              </div>
              
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                <div 
                  className="h-full rounded-full bg-plum transition-all duration-1000"
                  style={{ width: `${(s.metrics[i] / (s.members.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Applicant Verification */}
        <section className="rounded-[2rem] bg-white p-6 shadow-xl border border-stone-200/60 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/5 text-plum">
              <FileText size={20} />
            </div>
            <h2 className="text-2xl font-serif text-plum m-0">Applicant Verification</h2>
          </div>
          
          <div className="pt-6 space-y-4">
            {!s.applicants.length && <p className="text-stone-500 font-medium">No applications yet.</p>}
            {s.applicants.map((a) => (
              <details key={a.email} className="group rounded-2xl border border-stone-200 bg-white p-2 open:shadow-md transition-all">
                <summary className="flex cursor-pointer items-center justify-between p-3 font-bold text-plum list-none [&::-webkit-details-marker]:hidden">
                  <div>
                    <span className="block text-lg">{a.name}</span>
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{a.status}</span>
                  </div>
                  <ChevronDown size={20} className="text-stone-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-3 pb-4 pt-2">
                  <dl className="space-y-3 mb-4 rounded-xl bg-stone-50 p-4 border border-stone-100">
                    {Object.entries(JSON.parse(a.answers)).map(([key, v]) => (
                      <div key={key}>
                        <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">{key}</dt>
                        <dd className="text-sm font-medium text-stone-800 break-words">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  {a.status !== "active" && (
                    <ActionForm
                      label="Record decision"
                      success="Decision recorded."
                      run={(f) =>
                        post("admin/decision", {
                          email: a.email,
                          decision: f.get("decision"),
                        })
                      }
                    >
                      <label>
                        Decision
                        <select name="decision" className="!py-3">
                          <option value="invite">Approve and email invitation</option>
                          <option value="decline">Decline or revoke invitation</option>
                        </select>
                      </label>
                    </ActionForm>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Content Desk */}
        <section className="rounded-[2rem] bg-white p-6 shadow-xl border border-stone-200/60 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/5 text-plum">
              <CheckCircle size={20} />
            </div>
            <h2 className="text-2xl font-serif text-plum m-0">Content Desk</h2>
          </div>
          
          <div className="pt-6">
            <label className="mb-6">
              Choose an item
              <select value={edit} onChange={(e) => E(Number(e.target.value))}>
                <option value={0}>+ Create new content</option>
                {s.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.kind} / {i.title}
                  </option>
                ))}
              </select>
            </label>
            <ContentEditor key={edit} item={s.items.find((i) => i.id === edit)} />
          </div>
        </section>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Milestone Verification */}
        <section className="rounded-[2rem] bg-white p-6 shadow-xl border border-stone-200/60 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/5 text-plum">
              <CheckCircle size={20} />
            </div>
            <h2 className="text-2xl font-serif text-plum m-0">Milestone Verification</h2>
          </div>
          
          <div className="pt-6 space-y-4">
            {!s.members.length && <p className="text-stone-500 font-medium">Activated members appear here.</p>}
            {s.members.map((m) => (
              <div key={m.email} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-plum">{m.name}</h3>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">{m.email}</p>
                
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-stone-600">Verified:</span>
                  {m.done ? m.done.split(',').map(stage => (
                    <span key={stage} className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
                      {stage}
                    </span>
                  )) : <span className="text-sm text-stone-400 italic">None</span>}
                </div>

                {!m.done.includes("LEARN") && (
                  <ActionForm
                    label={"Verify " + (m.done.includes("LINK") ? "LEARN" : "LINK")}
                    run={() =>
                      post("admin/milestone", {
                        email: m.email,
                        stage: m.done.includes("LINK") ? "LEARN" : "LINK",
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Expert Review Queue */}
        <section className="rounded-[2rem] bg-white p-6 shadow-xl border border-stone-200/60 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum/5 text-plum">
              <FileText size={20} />
            </div>
            <h2 className="text-2xl font-serif text-plum m-0">Expert Review Queue</h2>
          </div>
          
          <div className="pt-6 space-y-4">
            {!s.projects.length && <p className="text-stone-500 font-medium">No case studies submitted.</p>}
            {s.projects.map((p) => (
              <article key={p.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <a href={"/api/project/" + p.id} className="text-lg font-bold text-plum hover:underline">
                    {p.title}
                  </a>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mt-1">Status: {p.status}</p>
                </div>
                
                {p.status === "submitted" && (
                  <ActionForm
                    label="Save expert decision"
                    run={(f) =>
                      post("admin/review", { id: p.id, ...Object.fromEntries(f) })
                    }
                  >
                    <Field name="feedback" label="Expert feedback" />
                    <label>
                      Outcome
                      <select name="status" className="!py-3">
                        <option value="approved">Approve</option>
                        <option value="revise">Request revision</option>
                      </select>
                    </label>
                  </ActionForm>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}