import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { CacheEntry, CacheProvider } from "./types";

export class FilesystemCacheProvider implements CacheProvider {
  constructor(private readonly rootDir: string) {}

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const raw = await readFile(this.filePath(key), "utf8");
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (entry.expiresAt <= Date.now()) {
        await this.delete(key);
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, options: { ttlSeconds: number; tags: string[] }) {
    const entry: CacheEntry<T> = {
      value,
      tags: options.tags,
      createdAt: Date.now(),
      expiresAt: Date.now() + options.ttlSeconds * 1000
    };
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.filePath(key), JSON.stringify(entry), "utf8");
  }

  async delete(key: string) {
    await rm(this.filePath(key), { force: true });
  }

  async revalidateTag(tag: string) {
    const index = await this.get<string[]>(this.tagKey(tag));
    for (const key of index?.value ?? []) {
      await this.delete(key);
    }
    await this.delete(this.tagKey(tag));
  }

  async setWithIndex<T>(key: string, value: T, options: { ttlSeconds: number; tags: string[] }) {
    await this.set(key, value, options);
    for (const tag of options.tags) {
      const tagKey = this.tagKey(tag);
      const current = await this.get<string[]>(tagKey);
      const next = Array.from(new Set([...(current?.value ?? []), key]));
      await this.set(tagKey, next, { ttlSeconds: options.ttlSeconds, tags: [] });
    }
  }

  private filePath(key: string) {
    return path.join(this.rootDir, `${createHash("sha256").update(key).digest("hex")}.json`);
  }

  private tagKey(tag: string) {
    return `tag:${tag}`;
  }
}
