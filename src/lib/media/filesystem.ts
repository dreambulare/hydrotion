import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type { MediaStore, StoredMedia } from "./types";

export class FilesystemMediaStore implements MediaStore {
  constructor(private readonly rootDir: string) {}

  async get(key: string): Promise<StoredMedia | null> {
    try {
      const meta = JSON.parse(await readFile(this.metaPath(key), "utf8")) as Omit<StoredMedia, "body">;
      if (meta.expiresAt <= Date.now()) {
        return null;
      }

      const body = await readFile(this.bodyPath(key));
      return {
        ...meta,
        body
      };
    } catch {
      return null;
    }
  }

  async set(key: string, media: StoredMedia) {
    await mkdir(this.rootDir, { recursive: true });
    await writeFile(this.metaPath(key), JSON.stringify({ ...media, body: undefined }), "utf8");
    await writeFile(this.bodyPath(key), media.body);
  }

  private bodyPath(key: string) {
    return path.join(this.rootDir, `${this.hash(key)}.bin`);
  }

  private metaPath(key: string) {
    return path.join(this.rootDir, `${this.hash(key)}.json`);
  }

  private hash(key: string) {
    return createHash("sha256").update(key).digest("hex");
  }
}
