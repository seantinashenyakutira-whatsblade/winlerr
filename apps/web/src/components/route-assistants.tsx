"use client";

import { usePathname } from "next/navigation";
import { AiConcierge } from "@/components/AiConcierge";
import { VoiceNote } from "@/components/VoiceNote";

export function RouteAssistants() {
  const pathname = usePathname();
  const isProductApp = pathname.startsWith("/winlerros") || pathname.startsWith("/dashboard") || pathname === "/login" || pathname === "/signup";
  if (isProductApp) return null;
  return <div className="route-assistants" style={{ display: "contents" }}><VoiceNote/><AiConcierge/></div>;
}
