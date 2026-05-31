import "server-only";
import { createHash } from "node:crypto";
import { getEnv } from "@/src/lib/config/env";
import { FilesystemMediaStore } from "./filesystem";
import { MemoryMediaStore } from "./memory";
import type { MediaStore, StoredMedia } from "./types";

let store: MediaStore | null = null;

export function getMediaStore() {
  if (store) {
    return store;
  }

  const env = getEnv();
  if (env.HYDROTION_MEDIA_PROVIDER === "filesystem") {
    store = new FilesystemMediaStore(env.HYDROTION_MEDIA_DIR);
  } else {
    store = new MemoryMediaStore();
  }

  return store;
}

export function mediaCacheKey(blockId: string, sourceUrl: string) {
  return `${blockId}:${createHash("sha256").update(sourceUrl).digest("hex")}`;
}

export async function getOrFetchMedia(input: {
  blockId: string;
  sourceUrl: string;
  ttlSeconds?: number;
}): Promise<StoredMedia> {
  const ttlSeconds = input.ttlSeconds ?? 60 * 60 * 24 * 30;
  const key = mediaCacheKey(input.blockId, input.sourceUrl);
  const mediaStore = getMediaStore();
  const cached = await mediaStore.get(key);
  if (cached) {
    return cached;
  }

  const response = await fetch(input.sourceUrl);
  if (!response.ok) {
    throw new Error(`Media fetch failed with ${response.status}.`);
  }

  const body = new Uint8Array(await response.arrayBuffer());
  const media: StoredMedia = {
    body,
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000
  };
  await mediaStore.set(key, media);
  return media;
}
