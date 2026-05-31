import { getSite } from "@/src/lib/notion/repository";
import { getOrFetchMedia } from "@/src/lib/media";

export const dynamic = "force-dynamic";
export const size = {
  width: 32,
  height: 32
};

export default async function Icon() {
  try {
    const site = await getSite();
    if (site.iconUrl?.startsWith("data:image/svg+xml;base64,")) {
      return new Response(Buffer.from(site.iconUrl.split(",")[1] ?? "", "base64"), {
        headers: {
          "content-type": "image/svg+xml",
          "cache-control": "no-store"
        }
      });
    }

    if (site.iconUrl?.startsWith("/api/media/")) {
      const media = await getMediaFromProxyUrl(site.iconUrl);
      if (media) {
        return media;
      }
    }

    if (site.iconUrl) {
      const response = await fetch(site.iconUrl);
      if (response.ok) {
        return new Response(await response.arrayBuffer(), {
          headers: {
            "content-type": response.headers.get("content-type") ?? "image/png",
            "cache-control": "no-store"
          }
        });
      }
    }
  } catch {
    // Fall through to the generated fallback icon.
  }

  return new Response(fallbackSvg(), {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "no-store"
    }
  });
}

async function getMediaFromProxyUrl(url: string) {
  const mediaUrl = new URL(url, "http://hydrotion.local");
  const encodedSource = mediaUrl.searchParams.get("source");
  if (!encodedSource) {
    return null;
  }

  const blockId = decodeURIComponent(mediaUrl.pathname.replace(/^\/api\/media\//, ""));
  const sourceUrl = Buffer.from(encodedSource, "base64url").toString("utf8");
  const media = await getOrFetchMedia({ blockId, sourceUrl });
  const body = media.body.buffer.slice(media.body.byteOffset, media.body.byteOffset + media.body.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "content-type": media.contentType,
      "cache-control": "no-store"
    }
  });
}

function fallbackSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><path d="M21 26h15v17h24V26h15v44H60V53H36v17H21z" fill="#203127"/></svg>`;
}
