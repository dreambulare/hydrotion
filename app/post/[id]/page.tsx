import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer, TableOfContents } from "@/src/components/BlockRenderer";
import { SetupState } from "@/src/components/SetupState";
import { SiteChrome } from "@/src/components/SiteChrome";
import { getPost, getSite, getTopics, resolvePostId } from "@/src/lib/notion/repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const postId = await resolvePostId(id);
    const post = await getPost(postId);
    if (!post) {
      return {};
    }

    return {
      title: post.title,
      description: post.blocks
        .flatMap((block) => block.richText ?? [])
        .map((text) => text.plainText)
        .join(" ")
        .slice(0, 160)
    };
  } catch {
    return {};
  }
}

export default async function PostPage({ params }: Props) {
  const data = await loadPostData(params);
  if (!data.ok) {
    return <SetupState error={data.error} />;
  }

  const { site, topics, post } = data;
  if (!post) {
    notFound();
  }
  const toc = post.blocks.find((block) => block.type === "table_of_contents")?.toc;

  return (
    <SiteChrome site={site} topics={topics}>
      <article className="article-shell">
        <header className="article-header">
          {post.coverUrl ? (
            <div className="article-cover-wrap">
              <img alt="" className="article-cover" src={post.coverUrl} />
            </div>
          ) : (
            <div className="article-fallback-backdrop" />
          )}
          <div className={toc?.length ? "article-header-text has-toc" : "article-header-text"}>
            <div className="article-title-block">
              <p className="eyebrow">{post.topic?.name ?? "Post"}</p>
              <time className="article-date" dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
              <h1>{post.title}</h1>
            </div>
          </div>
        </header>
        <div className={toc?.length ? "article-grid has-toc" : "article-grid"}>
          {toc?.length ? (
            <aside className="article-toc">
              <TableOfContents toc={toc} />
            </aside>
          ) : null}
          <div className="article-content">
            <BlockRenderer blocks={post.blocks} />
          </div>
        </div>
      </article>
    </SiteChrome>
  );
}

async function loadPostData(params: Props["params"]) {
  try {
    const { id } = await params;
    const postId = await resolvePostId(id);
    const [site, topics, post] = await Promise.all([getSite(), getTopics(), getPost(postId)]);
    return { ok: true as const, site, topics, post };
  } catch (error) {
    return { ok: false as const, error };
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(date);
}
