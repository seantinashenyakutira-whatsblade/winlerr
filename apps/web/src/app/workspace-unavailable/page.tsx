import type { Metadata } from "next";
import { ErrorExperience } from "@/components/error-experience";

export const metadata: Metadata = {
  title: "Workspace unavailable",
  robots: { index: false, follow: false },
};

export default function WorkspaceUnavailablePage() {
  return <ErrorExperience variant="workspace-unavailable" />;
}
