import type { MediaStore, StoredMedia } from "./types";

export class MemoryMediaStore implements MediaStore {
  private readonly entries = new Map<string, StoredMedia>();

  async get(key: string) {
    const media = this.entries.get(key);
    if (!media) {
      return null;
    }

    if (media.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return media;
  }

  async set(key: string, media: StoredMedia) {
    this.entries.set(key, media);
  }
}
