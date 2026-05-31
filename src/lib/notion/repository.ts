import "server-only";
import { getEnv, requireNotionEnv } from "@/src/lib/config/env";
import { cached } from "@/src/lib/cache";
import type { HydrotionPost, HydrotionPostSummary, HydrotionSite, HydrotionTopic } from "@/src/lib/content/types";
import { getNotionClient, withNotionRetry } from "./client";
import { mapPost, mapPostSummary, mapSite } from "./mapper";

const cacheTags = {
  site: "hydrotion:site",
  posts: "hydrotion:posts",
  post: (id: string) => `hydrotion:post:${id}`,
  topics: "hydrotion:topics"
};

const cacheKeyVersion = "v6";

export async function getSite(): Promise<HydrotionSite> {
  const env = getEnv();
  return cached(`${cacheKeyVersion}:site`, [cacheTags.site], env.HYDROTION_REVALIDATE_SECONDS, async () => {
    if (env.NOTION_DATABASE_ID) {
      const client = getNotionClient() as unknown as {
        databases: { retrieve: (args: { database_id: string }) => Promise<unknown> };
        dataSources: { retrieve: (args: { data_source_id: string }) => Promise<unknown> };
      };
      const database = await withNotionRetry(() => client.databases.retrieve({ database_id: env.NOTION_DATABASE_ID ?? "" }));
      const databaseSite = mapSite(database);
      const dataSourceId = await resolveDataSourceId();
      const dataSource = await withNotionRetry(() => client.dataSources.retrieve({ data_source_id: dataSourceId }));
      const dataSourceSite = mapSite(dataSource);
      return {
        title: dataSourceSite.title || databaseSite.title,
        description: dataSourceSite.description || databaseSite.description,
        iconUrl: dataSourceSite.iconUrl || databaseSite.iconUrl
      };
    }

    const dataSourceId = await resolveDataSourceId();
    const client = getNotionClient() as unknown as {
      dataSources: { retrieve: (args: { data_source_id: string }) => Promise<unknown> };
    };
    const dataSource = await withNotionRetry(() => client.dataSources.retrieve({ data_source_id: dataSourceId }));
    return mapSite(dataSource);
  });
}

export async function getPostSummaries(): Promise<HydrotionPostSummary[]> {
  const env = getEnv();
  return cached(`${cacheKeyVersion}:posts`, [cacheTags.posts], env.HYDROTION_REVALIDATE_SECONDS, async () => {
    const dataSourceId = await resolveDataSourceId();
    const pages = await queryPublishedPages(dataSourceId);
    return pages.map(mapPostSummary).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  });
}

export async function getTopics(): Promise<HydrotionTopic[]> {
  const env = getEnv();
  return cached(`${cacheKeyVersion}:topics`, [cacheTags.topics, cacheTags.posts], env.HYDROTION_REVALIDATE_SECONDS, async () => {
    const posts = await getPostSummaries();
    const topics = new Map<string, HydrotionTopic>();

    for (const post of posts) {
      if (!post.topic) {
        continue;
      }

      const existing = topics.get(post.topic.id);
      if (existing) {
        existing.posts.push(post);
      } else {
        topics.set(post.topic.id, {
          id: post.topic.id,
          name: post.topic.name,
          posts: [post]
        });
      }
    }

    return Array.from(topics.values());
  });
}

export async function getPost(id: string): Promise<HydrotionPost | null> {
  const env = getEnv();
  return cached(`${cacheKeyVersion}:post:${id}`, [cacheTags.post(id), cacheTags.posts], env.HYDROTION_REVALIDATE_SECONDS, async () => {
    const client = getNotionClient();
    const page = await withNotionRetry(() => client.pages.retrieve({ page_id: id }));
    const blocks = await fetchBlockTree(id);
    return mapPost(page, blocks);
  });
}

export async function resolvePostId(input: string) {
  const normalized = input.replaceAll("-", "");
  const posts = await getPostSummaries();
  return posts.find((post) => post.id.replaceAll("-", "") === normalized || post.slug === input)?.id ?? input;
}

export async function resolveDataSourceId(): Promise<string> {
  const env = requireNotionEnv();
  if (env.NOTION_DATA_SOURCE_ID) {
    return env.NOTION_DATA_SOURCE_ID;
  }

  const client = getNotionClient() as unknown as {
    databases: { retrieve: (args: { database_id: string }) => Promise<unknown> };
  };
  const database = await withNotionRetry(() => client.databases.retrieve({ database_id: env.NOTION_DATABASE_ID ?? "" }));
  const dataSources = asRecord(database).data_sources;
  if (Array.isArray(dataSources) && dataSources.length > 0) {
    const first = asRecord(dataSources[0]);
    const id = typeof first.id === "string" ? first.id : "";
    if (id) {
      return id;
    }
  }

  throw new Error("The Notion database has no data source visible to this integration.");
}

async function queryPublishedPages(dataSourceId: string) {
  const client = getNotionClient() as unknown as {
    dataSources: {
      query: (args: Record<string, unknown>) => Promise<{ results?: unknown[]; has_more?: boolean; next_cursor?: string | null }>;
    };
  };
  const results: unknown[] = [];
  let startCursor: string | null = null;

  do {
    const response = await withNotionRetry(() =>
      client.dataSources.query({
        data_source_id: dataSourceId,
        start_cursor: startCursor ?? undefined,
        filter: {
          and: [
            { property: "Name", title: { is_not_empty: true } },
            { property: "Publish", checkbox: { equals: true } }
          ]
        }
      })
    );
    results.push(...(response.results ?? []));
    startCursor = response.has_more ? response.next_cursor ?? null : null;
  } while (startCursor);

  return results;
}

async function fetchBlockTree(blockId: string) {
  const blocks = await fetchChildren(blockId);
  return Promise.all(blocks.map((block) => hydrateChildren(block)));
}

async function hydrateChildren(block: unknown): Promise<unknown> {
  const record = asRecord(block);
  if (!record.has_children || typeof record.type !== "string") {
    return block;
  }

  const children = await fetchChildren(typeof record.id === "string" ? record.id : "");
  const hydratedChildren = await Promise.all(children.map((child) => hydrateChildren(child)));
  const payload = asRecord(record[record.type]);
  return {
    ...record,
    [record.type]: {
      ...payload,
      children: hydratedChildren
    }
  };
}

async function fetchChildren(blockId: string) {
  const client = getNotionClient();
  const results: unknown[] = [];
  let startCursor: string | undefined;

  do {
    const response = await withNotionRetry(() =>
      client.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
        page_size: 100
      })
    );
    results.push(...response.results);
    startCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (startCursor);

  return results;
}

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }

  return {};
}
