import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Winlerr — Business systems that move work forward",
  description:
    "Winlerr builds practical business systems for growing teams: lead response, client operations, and focused product rollouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
