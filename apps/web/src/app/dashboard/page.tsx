import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { WinlaMark } from "@/components/winlaos/brand";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return <main className="winla-page grid min-h-screen place-items-center bg-[#faf9f5] px-5 text-[#173b32]"><section className="max-w-md text-center"><div className="mx-auto flex w-fit"><WinlaMark/></div><span className="mx-auto mt-10 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf2e9] text-[#52725b]"><LockKeyhole size={21}/></span><h1 className="mt-5 font-display text-2xl font-semibold">Your dashboard needs a live session</h1><p className="mt-3 text-sm leading-6 text-[#6c7a70]">The authentication backend is being integrated on a separate branch. This route stays locked until its server-side session check is available.</p><div className="mt-6 flex justify-center gap-3"><Link href="/login" className="rounded-xl bg-[#173b32] px-5 py-3 text-sm font-semibold text-white">Sign in</Link><Link href="/winlaos/preview" className="rounded-xl border border-[#d9dbd1] bg-white px-5 py-3 text-sm font-semibold">Open preview</Link></div></section></main>;
}
