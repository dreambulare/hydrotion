# Hydrotion

Hydrotion turns a Notion data source into a cache-first public blog.

The project is a Next.js App Router rewrite of the old NotionPaper prototype. It keeps the same publishing model, but separates Notion access, content parsing, media caching, rendering, and deployment concerns.

## Requirements

- Node.js 20.9 or newer.
- pnpm 11.
- A Notion integration token with access to the target database or data source.
- A Notion data source with these properties:
  - `Name` as title.
  - `Publish` as checkbox.
  - Optional `Original Create Time` as date.
  - Optional `Tags` as multi-select.
  - Optional `Topic` as select.

## Local Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Set either `NOTION_DATA_SOURCE_ID` or `NOTION_DATABASE_ID`. `NOTION_DATA_SOURCE_ID` is preferred for the Notion API version used by this project.

## Cache Model

Hydrotion does not require an external database.

- `memory`: works everywhere, but resets when the process or Worker isolate resets.
- `filesystem`: recommended for single-container self-hosting with a mounted persistent volume.
- `cloudflare`: current zero-storage Cloudflare mode. It uses in-process cache as a fallback. For production Cloudflare deployments, bind R2 and extend the media/cache providers to use it.

Notion-hosted media URLs expire. Hydrotion never treats those signed URLs as stable public URLs. It proxies them through `/api/media/...` and stores the downloaded file in the configured media store.

## Cloudflare Without a Database

This is supported as a degraded mode. Notion remains the source of truth, and Cloudflare only acts as a runtime and cache layer. It is suitable for personal blogs and low traffic.

For reliable media caching and better cache survival across regions, add R2. R2 is object storage, not a database, and is the natural place to keep Notion media and OpenNext incremental cache artifacts.

## Docker

```bash
docker build -t hydrotion .
docker run --env-file .env.local -p 3000:3000 hydrotion
```

For durable self-hosting, mount `.hydrotion-cache` and `.hydrotion-media` as volumes.

## Validation

```bash
pnpm harness
pnpm test
pnpm build
```
