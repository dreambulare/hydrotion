import { getEnv } from "@/src/lib/config/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getEnv();
  return Response.json({
    ok: true,
    cacheProvider: env.HYDROTION_CACHE_PROVIDER,
    mediaProvider: env.HYDROTION_MEDIA_PROVIDER,
    hasNotionToken: Boolean(env.NOTION_TOKEN),
    hasDataSource: Boolean(env.NOTION_DATA_SOURCE_ID || env.NOTION_DATABASE_ID)
  });
}
