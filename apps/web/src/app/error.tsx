"use client";

import { ErrorExperience } from "@/components/error-experience";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorExperience variant="unexpected" reset={reset} />;
}
