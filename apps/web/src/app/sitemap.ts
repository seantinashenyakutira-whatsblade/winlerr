import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/docs";

const BASE = "https://winlerr.vip";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/systems", changeFrequency: "monthly", priority: 0.8 },
    { path: "/docs", changeFrequency: "weekly", priority: 0.7 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/get-started", changeFrequency: "monthly", priority: 0.9 },
  ];

  return [
    ...routes.map((route) => ({
      url: `${BASE}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...ARTICLES.map((article) => ({
      url: `${BASE}/docs/${article.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
