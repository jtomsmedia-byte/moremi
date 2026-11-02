import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { identity } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";
export const metadata = {
  robots: { index: false, follow: false },
  manifest: "/member/manifest.webmanifest",
};
export default async function Page() {
  const u = identity((await cookies()).get("moremi")?.value);
  if (!u) redirect("/activate");
  if ((u.role === "admin") !== true)
    redirect(u.role === "admin" ? "/admin" : "/member");
  return <Dashboard admin={true} />;
}
