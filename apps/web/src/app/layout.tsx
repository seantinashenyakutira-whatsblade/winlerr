import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { RouteAssistants } from "@/components/route-assistants";
import "./globals.css";

const SITE_URL = "https://www.winlerr.vip";

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
    "Winlerr helps Zambian businesses build a clear online presence and explore connected systems for customer enquiries, conversations, and operations.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Winlerr",
    title: "Winlerr — Digital growth systems for Zambian businesses",
    description:
      "Business websites, customer workflow concepts, and WinlerrOS for businesses in Zambia.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Winlerr — Digital growth systems for Zambian businesses",
    description:
      "Business websites, customer workflow concepts, and WinlerrOS for businesses in Zambia.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="bg-surface font-sans text-ink">
        {children}
        <RouteAssistants />
      </body>
    </html>
  );
}
