/* eslint-disable no-restricted-globals */
import { source } from "@/lib/source";

import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = process.env["NEXT_PUBLIC_BASE_URL"] ?? "https://riven.tv";

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/generator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...docs,
  ];
}
