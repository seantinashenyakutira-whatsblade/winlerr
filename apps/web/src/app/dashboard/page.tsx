import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { WinlerrLogo } from "@/components/winlerr-logo";

export const metadata: Metadata = { title: "WinlerrOS dashboard", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return <main className="winlerros-page grid min-h-screen place-items-center bg-[#F8FAFC] px-5 text-[#111827]"><section className="max-w-md text-center"><div className="mx-auto flex w-fit"><WinlerrLogo href="/winlerros" product/></div><span className="mx-auto mt-10 grid h-12 w-12 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]"><LockKeyhole size={21}/></span><h1 className="mt-5 font-display text-2xl font-semibold">Your dashboard needs a live session</h1><p className="mt-3 text-sm leading-6 text-[#6c7a70]">The authentication backend is being integrated on a separate branch. This route stays locked until its server-side session check is available.</p><div className="mt-6 flex justify-center gap-3"><Link href="/login" className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white">Sign in</Link><Link href="/winlerros/preview" className="rounded-xl border border-[#cbd5e1] bg-white px-5 py-3 text-sm font-semibold">Open preview</Link></div></section></main>;
}
