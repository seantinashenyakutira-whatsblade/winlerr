import Link from "next/link";

export function WinlaMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/winlaos" className="inline-flex items-center gap-2.5 font-display font-semibold tracking-tight text-[#173b32]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173b32] text-xs font-bold tracking-tight text-[#fffaf0]">W/</span>
      {!compact && <span className="text-lg">WinlaOS</span>}
    </Link>
  );
}
