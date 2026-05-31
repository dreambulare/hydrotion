# Hydrotion (formerly as NotionPaper)

Hydrotion (formerly as NotionPaper) turns a Notion database or data source into a cache-first public blog.

It is a Next.js App Router rewrite of the old NotionPaper prototype. Notion remains the source of truth, while Hydrotion adds structured content parsing, media proxying, cache-first rendering, theme hooks, Cloudflare deployment, and container deployment.

Demo: [hydrotion.dreambulare.com](https://hydrotion.dreambulare.com/)

Repository: [dreambulare/hydrotion](https://github.com/dreambulare/hydrotion)

## Usage & tutorial
Check [hydrotion.dreambulare.com](https://hydrotion.dreambulare.com/).

## Features

- Reads published posts from a Notion data source.
- Supports Notion database IDs and resolves the first data source automatically.
- Caches Notion API responses to avoid slow per-request rendering.
- Proxies Notion file URLs through `/api/media/...` because Notion-hosted media links expire.
- Supports local filesystem cache, in-memory cache, and Cloudflare runtime mode.
- Provides an authenticated `/api/revalidate` endpoint for manual refresh.
- Renders Notion covers, rich text, lists, tables, media, embedded YouTube videos, and article table of contents.
- Supports Cloudflare Workers deployment through `@opennextjs/cloudflare`.
- Supports self-hosted Docker deployment.
- Publishes Docker images to GitHub Container Registry through GitHub Actions.

## Requirements

- Node.js 20.9 or newer for local development.
- pnpm 11.
- A Notion integration token with access to the target database or data source.
- A Notion data source with these properties:
  - `Name` as title.
  - `Publish` as checkbox.
  - Optional `Original Create Time` as date.
  - Optional `Tags` as multi-select.
  - Optional `Topic` as select.

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

| Variable | Required | Description |
| --- | --- | --- |
| `NOTION_TOKEN` | Yes | Internal Notion integration token. Treat this as a secret. |
| `NOTION_DATA_SOURCE_ID` | One of data source or database | Preferred Notion data source ID. |
| `NOTION_DATABASE_ID` | One of data source or database | Notion database ID or database URL. Hydrotion extracts the ID and resolves the first visible data source from it. |
| `HYDROTION_SITE_URL` | No | Public base URL. Defaults to `http://localhost:3000`. |
| `HYDROTION_REFRESH_SECRET` | Yes for revalidation | Bearer token required by `/api/revalidate`. Treat this as a secret. |
| `HYDROTION_CACHE_PROVIDER` | No | `filesystem`, `memory`, or `cloudflare`. Defaults to `filesystem`. |
| `HYDROTION_CACHE_DIR` | No | Filesystem directory for rendered content cache. |
| `HYDROTION_MEDIA_PROVIDER` | No | `filesystem`, `memory`, or `cloudflare`. Defaults to `filesystem`. |
| `HYDROTION_MEDIA_DIR` | No | Filesystem directory for proxied Notion media. |
| `HYDROTION_THEME` | No | Theme key reserved for custom themes. |
| `HYDROTION_REVALIDATE_SECONDS` | No | Time-based cache TTL in seconds. |

## Local Development

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Run validation before publishing changes:

```bash
pnpm harness
pnpm test
pnpm lint
pnpm build
```

## Revalidation

Hydrotion caches content so normal page rendering does not call Notion for every request.

Refresh all shared site/list/topic caches:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer $HYDROTION_REFRESH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"all":true}'
```

Refresh one post cache:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer $HYDROTION_REFRESH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tag":"hydrotion:post:<page-id>"}'
```

## Cache and Media Model

Hydrotion does not require an external database.

- `memory`: works anywhere, but resets when the process, container, or Worker isolate resets.
- `filesystem`: recommended for self-hosted containers with mounted volumes.
- `cloudflare`: works without a database and currently falls back to runtime memory in this project. It is acceptable for simple personal sites, but cache survival depends on Worker isolate lifetime.

Notion file URLs are signed URLs with an expiry time. Hydrotion maps them to `/api/media/...` and stores the downloaded bytes in the configured media store. For durable self-hosted deployments, mount `.hydrotion-media`. For durable Cloudflare deployments, extend the cache and media providers to use R2.

## Docker Image

The repository includes a production Dockerfile that builds Next.js in standalone mode and starts `server.js` on port `3000`.

Build locally:

```bash
docker build -t hydrotion .
```

Run with an env file:

```bash
docker run --rm \
  --env-file .env.local \
  -p 3000:3000 \
  hydrotion
```

Run with durable local cache and media storage:

```bash
mkdir -p .hydrotion-cache .hydrotion-media

docker run --rm \
  --env-file .env.local \
  -p 3000:3000 \
  -v "$PWD/.hydrotion-cache:/app/.hydrotion-cache" \
  -v "$PWD/.hydrotion-media:/app/.hydrotion-media" \
  hydrotion
```

For an environment without persistent storage, set providers to `memory`:

```bash
docker run --rm \
  -e NOTION_TOKEN="$NOTION_TOKEN" \
  -e NOTION_DATABASE_ID="$NOTION_DATABASE_ID" \
  -e HYDROTION_REFRESH_SECRET="$HYDROTION_REFRESH_SECRET" \
  -e HYDROTION_CACHE_PROVIDER=memory \
  -e HYDROTION_MEDIA_PROVIDER=memory \
  -p 3000:3000 \
  hydrotion
```

This works, but content and media cache are lost when the container restarts.

## GitHub Container Registry

GitHub Actions builds and publishes the Docker image to GitHub Container Registry.

Workflow file:

```text
.github/workflows/docker-image.yml
```

Image name:

```text
ghcr.io/dreambulare/hydrotion
```

Tags:

- `latest` on the default branch.
- `main` on pushes to `main`.
- `sha-<commit>` for every build.
- Git tags such as `v1.0.0`.
- Pull requests are built for validation but not pushed.

After the workflow runs, make the package public if needed:

1. Open the GitHub repository.
2. Go to Packages.
3. Open `hydrotion`.
4. Change package visibility to public, or keep it private and authenticate with `docker login ghcr.io`.

Pull and run:

```bash
docker pull ghcr.io/dreambulare/hydrotion:latest

docker run --rm \
  --env-file .env.local \
  -p 3000:3000 \
  ghcr.io/dreambulare/hydrotion:latest
```

## Cloudflare Workers Deployment

Hydrotion uses `@opennextjs/cloudflare`, which converts the Next.js app into a Cloudflare Worker with static assets. In the Cloudflare dashboard this lives under Workers & Pages, but the runtime target is Workers.

The required project files are already present:

- `wrangler.jsonc`
- `open-next.config.ts`
- `public/_headers`

The Wrangler config enables:

- `nodejs_compat`
- `global_fetch_strictly_public`
- Worker static assets from `.open-next/assets`
- required secrets validation for `NOTION_TOKEN` and `HYDROTION_REFRESH_SECRET`

### Cloudflare Prerequisites

Install dependencies and authenticate Wrangler:

```bash
pnpm install
pnpm wrangler login
```

Set runtime secrets:

```bash
pnpm wrangler secret put NOTION_TOKEN
pnpm wrangler secret put HYDROTION_REFRESH_SECRET
```

Set one of the Notion values as a runtime variable in the Cloudflare dashboard:

- `NOTION_DATA_SOURCE_ID`
- `NOTION_DATABASE_ID`, either as a bare ID or a Notion database URL such as `https://app.notion.com/p/be7763e8cfd54337be2eaf474af82c1c?v=...`

Also set:

- `HYDROTION_SITE_URL` to your public Cloudflare URL or custom domain.
- `HYDROTION_REVALIDATE_SECONDS` if you want a TTL other than the default.

The committed `wrangler.jsonc` sets these runtime variables by default:

```json
{
  "HYDROTION_CACHE_PROVIDER": "cloudflare",
  "HYDROTION_MEDIA_PROVIDER": "cloudflare"
}
```

### Preview Locally in the Workers Runtime

```bash
pnpm preview:cloudflare
```

This builds the Next.js app with OpenNext and serves the generated Worker locally through Wrangler.

### Deploy from the CLI

If all runtime variables are defined in `wrangler.jsonc`, run:

```bash
pnpm deploy:cloudflare
```

If you configured runtime variables or secrets in the Cloudflare dashboard, use the keep-vars deploy script so Wrangler does not remove dashboard-managed variables:

```bash
pnpm deploy:cloudflare:keep-vars
```

### Deploy with Cloudflare Git Integration

Cloudflare can connect a GitHub repository to a Worker and build on pushes to the production branch.

Use these settings:

| Setting | Value |
| --- | --- |
| Framework preset | None or Next.js if offered |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm opennextjs-cloudflare build` |
| Deploy command | `pnpm opennextjs-cloudflare deploy -- --keep-vars` |
| Output directory | Leave empty unless Cloudflare requires one |

In Cloudflare Workers Builds, configure both build variables and runtime variables/secrets. The app reads Notion credentials at runtime, so `NOTION_TOKEN`, `HYDROTION_REFRESH_SECRET`, and either `NOTION_DATA_SOURCE_ID` or `NOTION_DATABASE_ID` must be available to the deployed Worker.

### Cloudflare Without a Database

This is viable for simple blogs:

- Notion is the source of truth.
- Worker memory cache reduces repeated Notion calls while the isolate remains warm.
- Notion media is proxied, but without durable storage the media cache may be lost between isolates.

For higher traffic or better media durability, add R2 and implement Cloudflare-backed cache/media stores. OpenNext also supports an R2 binding named `NEXT_INC_CACHE_R2_BUCKET` for its incremental cache.

## Deployment Tradeoffs

| Deployment | External database | Persistent media cache | Best for |
| --- | --- | --- | --- |
| Cloudflare no R2 | No | No | Small personal blogs, low traffic |
| Cloudflare with R2 extension | No database, R2 object storage | Yes | Production edge deployment |
| Docker without volumes | No | No | Ephemeral testing |
| Docker with volumes | No | Yes | Self-hosted production |

## Security Notes

- Never commit `.env`, `.env.local`, `.dev.vars`, cache directories, or media directories.
- `NOTION_TOKEN` and `HYDROTION_REFRESH_SECRET` should be stored as Cloudflare secrets or container secrets.
- The Docker build context excludes local env and cache files through `.dockerignore`.
- GitHub Actions uses the repository `GITHUB_TOKEN` to push to GHCR.
