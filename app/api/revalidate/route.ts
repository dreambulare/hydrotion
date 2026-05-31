import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { getCacheProvider } from "@/src/lib/cache";
import { getEnv } from "@/src/lib/config/env";

export const dynamic = "force-dynamic";

const allowedTags = ["hydrotion:site", "hydrotion:posts", "hydrotion:topics"];

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env.HYDROTION_REFRESH_SECRET) {
    return Response.json({ ok: false, error: "Refresh secret is not configured." }, { status: 403 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${env.HYDROTION_REFRESH_SECRET}`) {
    return Response.json({ ok: false, error: "Invalid refresh token." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.all === true) {
    for (const tag of allowedTags) {
      await getCacheProvider().revalidateTag(tag);
      revalidateTag(tag, { expire: 0 });
    }
    return Response.json({ ok: true, tags: allowedTags });
  }

  const tag = typeof body.tag === "string" ? body.tag : "hydrotion:posts";
  if (!allowedTags.includes(tag) && !tag.startsWith("hydrotion:post:")) {
    return Response.json({ ok: false, error: "Tag is not allowed." }, { status: 400 });
  }

  await getCacheProvider().revalidateTag(tag);
  revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, tag });
}
