"use client";

import "./globals.css";
import { ErrorExperience } from "@/components/error-experience";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
        <ErrorExperience variant="fatal" reset={reset} />
      </body>
    </html>
  );
}
