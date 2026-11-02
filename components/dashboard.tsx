"use client";
import { useState, useEffect } from "react";
import { Admin } from "./admin";
import { ActionForm, post } from "./forms";
import { LinkSection, LearnSection, LeadSection } from "./sections";
import { stages, type Snapshot } from "@/lib/model";
import { LogOut, CheckCircle2, Video, Activity } from "lucide-react";

export function Dashboard({ admin }: { admin: boolean }) {
  // These are the missing variables that caused the crash
  const [s, S] = useState<Snapshot | null>(null);
  const [status, M] = useState("Connecting…");
    
  useEffect(() => {
    let active = true, sequence = 0;
    const refresh = async () => {
      const n = ++sequence;
      try {
        const r = await fetch("/api/state", { cache: "no-store" });
        if (r.status === 401) { location.replace("/activate"); return; }
        if (!r.ok) throw Error();
        const data = await r.json();
        if (active && sequence === n) { S(data); M("Synced"); }
      } catch {
        if (active) M("Connection interrupted. Reconnecting…");
      }
    };
    const events = new EventSource("/api/changes");
    events.onmessage = refresh;
    events.onerror = () => M("Reconnecting…");
    refresh();
    if (!admin && "serviceWorker" in navigator)
      navigator.serviceWorker.register("/member/sw.js", { scope: "/member/" }).catch(() => M("Offline access unavailable."));
    return () => { active = false; events.close(); };
  }, [admin]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* App-Style Dark Header */}
      <header className="relative overflow-hidden flex flex-col gap-6 rounded-[2rem] bg-gradient-to-br from-plum to-[#2b143b] p-8 text-white shadow-2xl sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gold blur-[120px] opacity-10" />
        
        <div className="relative z-10 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gold">
            Moremi Movement / {admin ? "Staff Console" : "Member Space"}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-white font-serif tracking-tight">
            {admin ? "Programme Command" : s ? "Welcome, " + s.name.split(" ")[0] : "Dashboard"}
          </h1>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 w-fit text-sm font-semibold backdrop-blur-md border border-white/10" role="status">
            <Activity size={16} className={status === "Synced" ? "text-green-400" : "text-amber-400 animate-pulse"} />
            {status}
          </div>
        </div>
        
        <div className="relative z-10">
          <ActionForm
            run={async () => {
              await post("logout", {});
              if ("caches" in window) await caches.delete("moremi-personal");
              location.replace("/activate");
            }}
          >
            <button className="flex w-full sm:w-auto min-h-[3.5rem] items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-bold text-white backdrop-blur transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-95 border border-white/10 shadow-sm">
              <LogOut size={18} /> Sign Out
            </button>
          </ActionForm>
        </div>
      </header>

      {!s ? (
        <div className="flex h-64 items-center justify-center rounded-[2rem] border border-stone-200 bg-white shadow-xl">
          <p className="animate-pulse font-bold text-plum text-lg">Loading programme records…</p>
        </div>
      ) : admin ? (
        <Admin s={s} />
      ) : (
        <>
          {/* Progress Card */}
          <section className="rounded-[2rem] bg-white p-6 shadow-xl border border-stone-200/60 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-plum/60">Founding Cohort · Lagos</p>
                <h2 className="mt-1 text-3xl sm:text-4xl text-plum font-serif">
                  {s.day ? "Day " + s.day + " of M90" : "Your cohort starts soon"}
                </h2>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-plum/5 text-plum shrink-0">
                <CheckCircle2 size={32} />
              </div>
            </div>
            
            <div className="space-y-3 pt-6">
              <progress aria-label="Elapsed programme days" max={90} value={s.day} />
              <p className="text-sm font-bold text-stone-400 text-right uppercase tracking-wider">{s.day} / 90 Days Elapsed</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
              {stages.map((x) => {
                const done = s.progress.includes(x.name);
                return (
                  <div key={x.name} className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center transition-colors ${done ? "bg-plum text-white shadow-md" : "bg-stone-50 border border-stone-200 text-stone-400"}`}>
                    {done ? <CheckCircle2 size={24} className="text-gold" /> : <div className="h-6 w-6 rounded-full border-2 border-stone-300" />}
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">{x.name}</span>
                  </div>
                );
              })}
            </div>
          </section>
          
          {/* Live Meeting Alert */}
          {s.items.some((i) => ["Meeting", "Stream"].includes(i.kind) && i.live === 1) && (
            <a className="group relative flex flex-col sm:flex-row items-center justify-between overflow-hidden rounded-[2rem] bg-gold px-8 py-6 text-ink shadow-lg transition-transform hover:scale-[1.01]" href="#link">
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/40 backdrop-blur-md">
                  <Video size={24} className="text-plum" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-plum/60">Live right now</p>
                  <p className="text-xl font-bold font-serif text-plum">Join the cohort meeting</p>
                </div>
              </div>
              <span className="mt-4 sm:mt-0 relative z-10 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-plum opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-plum"></span>
              </span>
            </a>
          )}
          
          <LinkSection s={s} />
          <LearnSection items={s.items} />
          <LeadSection s={s} />
        </>
      )}
    </div>
  );
}