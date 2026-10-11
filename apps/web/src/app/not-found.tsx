import type { Metadata } from "next";
import { ErrorExperience } from "@/components/error-experience";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <ErrorExperience variant="not-found" />;
}
