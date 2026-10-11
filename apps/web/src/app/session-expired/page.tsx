import type { Metadata } from "next";
import { ErrorExperience } from "@/components/error-experience";

export const metadata: Metadata = {
  title: "Sign in to continue",
  robots: { index: false, follow: false },
};

export default function SessionExpiredPage() {
  return <ErrorExperience variant="session-expired" />;
}
