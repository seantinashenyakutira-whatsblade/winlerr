import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { VoiceNote } from "@/components/VoiceNote";
import "./globals.css";

const SITE_URL = "https://winlerr.vip";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Winlerr — Digital growth systems for Zambian businesses",
    template: "%s — Winlerr",
  },
  description:
    "Winlerr gives Zambian businesses a free professional website, then the AI systems that answer, qualify, and follow up with every lead — WhatsApp-first, always on.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Winlerr",
    title: "Winlerr — Digital growth systems for Zambian businesses",
    description:
      "Free website. AI-powered lead response, WhatsApp automation, and booking — built for Zambian SMEs.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Winlerr — Digital growth systems for Zambian businesses",
    description:
      "Free website. AI-powered lead response, WhatsApp automation, and booking — built for Zambian SMEs.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-surface font-sans text-ink">
        {children}
        <VoiceNote />
      </body>
    </html>
  );
}
