import type { MetadataRoute } from "next";
import { getEnv } from "@/src/lib/config/env";
import { getPostSummaries } from "@/src/lib/notion/repository";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const env = getEnv();
  try {
    const posts = await getPostSummaries();
    return [
      {
        url: env.HYDROTION_SITE_URL,
        lastModified: new Date()
      },
      ...posts.map((post) => ({
        url: `${env.HYDROTION_SITE_URL}/post/${post.slug}`,
        lastModified: post.updatedAt || post.createdAt
      }))
    ];
  } catch {
    return [
      {
        url: env.HYDROTION_SITE_URL,
        lastModified: new Date()
      }
    ];
  }
}
