import type { Metadata } from "next";
import { ErrorExperience } from "@/components/error-experience";

export const metadata: Metadata = {
  title: "Connection issue",
  robots: { index: false, follow: false },
};

export default function ServiceUnavailablePage() {
  return <ErrorExperience variant="service-unavailable" />;
}
