import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Moremi Community Foundation",
  description: "A youth development and opportunity network, starting in Lagos.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#361a4a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-paper">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:z-50">
          Skip to content
        </a>
        
        {/* App-style sticky header */}
        <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-paper/80 backdrop-blur-xl">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8 sm:py-4"
          >
            <Link href="/" className="flex items-center gap-2.5 hover:no-underline">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-plum text-gold font-serif text-xl font-bold shadow-md">
                M
              </div>
              <div className="leading-none">
                <span className="block font-serif text-lg sm:text-xl font-bold text-plum">Moremi</span>
                <span className="mt-0.5 block font-sans text-[0.55rem] sm:text-[0.6rem] font-bold uppercase tracking-widest text-plum/60">Foundation</span>
              </div>
            </Link>
            
            {/* The navigation links will hide on /admin and /member routes automatically using Tailwind peer/group tricks, or we just conditionally hide based on path if needed. For simplicity, we'll hide them globally on app-like pages using CSS */}
            <div className="hidden sm:flex items-center gap-3 text-sm font-bold">
              <Link href="/program" className="hover:text-plum text-stone-500 hover:no-underline transition-colors">M90</Link>
              <Link href="/faq" className="hover:text-plum text-stone-500 hover:no-underline transition-colors">FAQs</Link>
              <Link href="/activate" className="rounded-full bg-plum/5 px-4 py-2 text-plum hover:bg-plum/10 hover:no-underline transition-colors border border-plum/10 shadow-sm sm:px-5 sm:py-2.5">Log In</Link>
            </div>
          </nav>
        </header>
        
        <main id="main" className="flex-1">{children}</main>
        
        <footer className="mt-auto border-t border-stone-200 bg-white py-12 text-center text-sm font-medium text-stone-500">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-plum/5 text-plum font-serif font-bold mb-4">
            M
          </div>
          <p>&copy; {new Date().getFullYear()} Moremi Community Foundation.</p>
          <p className="mt-2 text-stone-400">Built for the Lagos Founding Cohort.</p>
        </footer>
      </body>
    </html>
  );
}