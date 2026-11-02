import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Lead } from "@/components/forms";
import { stages } from "@/lib/model";

export default function Home() {
  return (
    <div className="space-y-12 pb-12">
      {/* Bold Mobile-First Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-plum px-6 py-16 text-white shadow-2xl sm:px-12 sm:py-24 lg:px-20">
        {/* Decorative background gradients */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-plum-light blur-[100px] opacity-60 mix-blend-screen" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-gold blur-[120px] opacity-20 mix-blend-screen" />
        
        <div className="relative z-10 grid lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Sparkles size={16} className="text-gold" />
              <p className="text-xs sm:text-sm font-bold tracking-widest text-gold uppercase">
                Lagos Founding Cohort / Ages 18–35
              </p>
            </div>
            
            <h1 className="text-white text-balance">
              Your ambition deserves the right circle.
            </h1>
            
            <p className="max-w-lg text-lg sm:text-xl font-medium text-white/80 leading-relaxed">
              Meet people who take your ideas seriously. Spend 90 days learning from mentors and building something your community can use.
            </p>
            
            <Link
              href="/program"
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 text-lg font-bold text-plum shadow-[0_0_40px_rgb(233,201,133,0.3)] transition-all hover:scale-105 hover:bg-white hover:shadow-[0_0_50px_rgb(255,255,255,0.4)] active:scale-95"
            >
              Explore M90 
              <ArrowUpRight size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>

          <figure className="mt-12 lg:mt-0">
            <div className="relative aspect-[4/5] sm:aspect-video lg:aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
              {process.env.FOUNDER_VIDEO_URL ? (
                <video
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                  src={process.env.FOUNDER_VIDEO_URL}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                    <span className="font-serif text-4xl text-gold">M</span>
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl text-white">
                    Opening doors.<br />
                    <span className="text-gold italic">Raising leaders.</span>
                  </h2>
                </div>
              )}
            </div>
            <figcaption className="mt-4 text-center text-sm font-medium text-white/50">
              {process.env.FOUNDER_VIDEO_URL
                ? "A welcome from the convener"
                : "Convener’s welcome film · coming soon"}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Pillars / Stages */}
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h2>How the 90 days work</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {stages.map((s, i) => (
            <article key={s.name} className="panel relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="font-serif text-8xl font-bold text-plum">{i + 1}</span>
              </div>
              <p className="eyebrow">{s.days}</p>
              <h3 className="text-3xl text-plum">{s.promise}</h3>
              <p className="text-stone-600 font-medium leading-relaxed relative z-10">{s.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <Lead />
    </div>
  );
}