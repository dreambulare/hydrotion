import "server-only";
import { getEnv } from "@/src/lib/config/env";
import { FilesystemCacheProvider } from "./filesystem";
import { MemoryCacheProvider } from "./memory";
import type { CacheProvider } from "./types";

let provider: CacheProvider | null = null;

export function getCacheProvider(): CacheProvider {
  if (provider) {
    return provider;
  }

  const env = getEnv();
  if (env.HYDROTION_CACHE_PROVIDER === "memory" || env.HYDROTION_CACHE_PROVIDER === "cloudflare") {
    provider = new MemoryCacheProvider();
    return provider;
  }

  const filesystem = new FilesystemCacheProvider(env.HYDROTION_CACHE_DIR);
  provider = {
    ...filesystem,
    get: filesystem.get.bind(filesystem),
    set: filesystem.setWithIndex.bind(filesystem),
    delete: filesystem.delete.bind(filesystem),
    revalidateTag: filesystem.revalidateTag.bind(filesystem)
  };
  return provider;
}

export async function cached<T>(key: string, tags: string[], ttlSeconds: number, loader: () => Promise<T>) {
  const cache = getCacheProvider();
  const existing = await cache.get<T>(key);
  if (existing) {
    return existing.value;
  }

  const value = await loader();
  await cache.set(key, value, { tags, ttlSeconds });
  return value;
}
