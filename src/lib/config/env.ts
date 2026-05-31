import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NOTION_TOKEN: z.string().min(1).optional(),
  NOTION_DATA_SOURCE_ID: z.string().min(1).optional(),
  NOTION_DATABASE_ID: z.string().min(1).optional(),
  HYDROTION_SITE_URL: z.string().url().default("http://localhost:3000"),
  HYDROTION_REFRESH_SECRET: z.string().min(8).optional(),
  HYDROTION_CACHE_PROVIDER: z.enum(["memory", "filesystem", "cloudflare"]).default("filesystem"),
  HYDROTION_CACHE_DIR: z.string().default(".hydrotion-cache"),
  HYDROTION_MEDIA_PROVIDER: z.enum(["memory", "filesystem", "cloudflare"]).default("filesystem"),
  HYDROTION_MEDIA_DIR: z.string().default(".hydrotion-media"),
  HYDROTION_THEME: z.string().default("default"),
  HYDROTION_REVALIDATE_SECONDS: z.coerce.number().int().positive().default(3600)
});

export type HydrotionEnv = z.infer<typeof envSchema>;

let cachedEnv: HydrotionEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}

export function requireNotionEnv() {
  const env = getEnv();
  if (!env.NOTION_TOKEN) {
    throw new Error("NOTION_TOKEN is required.");
  }

  if (!env.NOTION_DATA_SOURCE_ID && !env.NOTION_DATABASE_ID) {
    throw new Error("NOTION_DATA_SOURCE_ID or NOTION_DATABASE_ID is required.");
  }

  return env;
}
