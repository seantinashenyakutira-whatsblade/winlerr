import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Winlerr — Business systems that move work forward",
  description:
    "Winlerr designs and builds practical business systems, automation, and client operating tools for growing teams.",
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
