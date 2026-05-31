export type StoredMedia = {
  body: Uint8Array;
  contentType: string;
  createdAt: number;
  expiresAt: number;
};

export type MediaStore = {
  get(key: string): Promise<StoredMedia | null>;
  set(key: string, media: StoredMedia): Promise<void>;
};
