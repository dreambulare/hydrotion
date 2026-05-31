export type CacheEntry<T> = {
  value: T;
  tags: string[];
  createdAt: number;
  expiresAt: number;
};

export type CacheProvider = {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, value: T, options: { ttlSeconds: number; tags: string[] }): Promise<void>;
  delete(key: string): Promise<void>;
  revalidateTag(tag: string): Promise<void>;
};
