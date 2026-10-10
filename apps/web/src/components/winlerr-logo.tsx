import Link from "next/link";

type WinlerrLogoProps = {
  href?: string;
  product?: boolean;
  inverse?: boolean;
  compact?: boolean;
};

/** Shared W/ mark and lowercase Winlerr wordmark used by the public site. */
export function WinlerrLogo({ href = "/", product = false, inverse = false, compact = false }: WinlerrLogoProps) {
  return (
    <Link
      href={href}
      aria-label={product ? "WinlerrOS" : "Winlerr home"}
      className={`inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight ${inverse ? "text-white" : "text-ink"}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-card font-mono text-sm ${inverse ? "bg-white text-ink" : "bg-ink text-white"}`}>W/</span>
      {!compact && <span>winlerr{product && <span className="text-brand-600">OS</span>}</span>}
    </Link>
  );
}
