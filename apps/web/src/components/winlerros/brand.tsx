import Link from "next/link";

export function WinlerrLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/winlerros" className={`inline-flex items-center gap-2.5 font-display font-semibold tracking-tight ${inverse ? "text-white" : "text-ink"}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold tracking-tight ${inverse ? "bg-white text-ink" : "bg-ink text-white"}`}>W/</span>
      {!compact && <span className="text-lg">WinlerrOS</span>}
    </Link>
  );
}