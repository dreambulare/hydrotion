import type { NextRequest } from "next/server";
import { getOrFetchMedia } from "@/src/lib/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = {
  params: Promise<{ key: string[] }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { key } = await params;
  const blockId = key.join("/");
  const encodedSource = request.nextUrl.searchParams.get("source");
  if (!encodedSource) {
    return Response.json({ ok: false, error: "Missing media source." }, { status: 400 });
  }

  const sourceUrl = Buffer.from(encodedSource, "base64url").toString("utf8");
  const media = await getOrFetchMedia({ blockId, sourceUrl });
  const body = media.body.buffer.slice(media.body.byteOffset, media.body.byteOffset + media.body.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "content-type": media.contentType,
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}
