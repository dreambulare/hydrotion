import type { CacheEntry, CacheProvider } from "./types";

export class MemoryCacheProvider implements CacheProvider {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  async set<T>(key: string, value: T, options: { ttlSeconds: number; tags: string[] }) {
    this.entries.set(key, {
      value,
      tags: options.tags,
      createdAt: Date.now(),
      expiresAt: Date.now() + options.ttlSeconds * 1000
    });
  }

  async delete(key: string) {
    this.entries.delete(key);
  }

  async revalidateTag(tag: string) {
    for (const [key, entry] of this.entries) {
      if (entry.tags.includes(tag)) {
        this.entries.delete(key);
      }
    }
  }
}
