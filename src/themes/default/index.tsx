import { BlockRenderer, TableOfContents } from "@/src/components/BlockRenderer";
import { Pagination } from "@/src/components/Pagination";
import { PostList } from "@/src/components/PostList";
import { SiteChrome } from "@/src/components/SiteChrome";
import type { HydrotionTheme, ThemeHomeProps, ThemePostProps, ThemeTopicProps } from "@/src/themes/types";
import { formatLongDate } from "@/src/themes/shared";

function Home({ site, posts, pagination }: ThemeHomeProps) {
  return (
    <section className="home-shell">
      <div className="home-intro">
        <h1>{site.title}</h1>
        {site.description ? <p>{site.description}</p> : null}
      </div>
      <PostList posts={posts} />
      <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
    </section>
  );
}

function Topic({ topic }: ThemeTopicProps) {
  return (
    <section className="topic-shell">
      <p className="eyebrow">Topic</p>
      <h1>{topic.name}</h1>
      <PostList posts={topic.posts} />
    </section>
  );
}

function Post({ post }: ThemePostProps) {
  const toc = post.blocks.find((block) => block.type === "table_of_contents")?.toc;

  return (
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
              {formatLongDate(post.createdAt)}
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
  );
}

export const defaultTheme: HydrotionTheme = {
  name: "default",
  Chrome: SiteChrome,
  Home,
  Topic,
  Post
};
