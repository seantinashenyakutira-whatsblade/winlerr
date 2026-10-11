import type { Metadata } from "next";
import { ErrorExperience } from "@/components/error-experience";

export const metadata: Metadata = {
  title: "Access restricted",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return <ErrorExperience variant="access-denied" />;
}
