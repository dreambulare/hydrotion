import Link from "next/link";
import { BlockRenderer, TableOfContents } from "@/src/components/BlockRenderer";
import { Pagination } from "@/src/components/Pagination";
import type { HydrotionTheme, ThemeChromeProps, ThemeHomeProps, ThemePostProps, ThemeTopicProps } from "@/src/themes/types";
import { formatLongDate, formatShortDate } from "@/src/themes/shared";

function Chrome({ site, topics, children }: ThemeChromeProps) {
  return (
    <>
      <header className="minimal-header">
        <div>
          <Link className="minimal-brand" href="/">
            {site.iconUrl ? <img alt="" className="minimal-brand-icon" src={site.iconUrl} /> : null}
            <span>{site.title}</span>
          </Link>
          {site.description ? <p>{site.description}</p> : null}
        </div>
        <nav aria-label="Topics">
          {topics.map((topic) => (
            <Link href={`/topic/${topic.id}`} key={topic.id}>
              {topic.name}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="minimal-footer">
        <a href="https://github.com/dreambulare/hydrotion">Hydrotion</a>
        <span>Notion-backed publishing.</span>
      </footer>
    </>
  );
}

function Home({ site, posts, pagination }: ThemeHomeProps) {
  return (
    <section className="minimal-home">
      <header>
        <p className="minimal-kicker">Notebook</p>
        <h1>{site.title}</h1>
      </header>
      <ol className="minimal-posts">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/post/${post.slug}`}>
              <time dateTime={post.createdAt}>{formatShortDate(post.createdAt)}</time>
              <span>{post.title}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
    </section>
  );
}

function Topic({ topic }: ThemeTopicProps) {
  return (
    <section className="minimal-home">
      <header>
        <p className="minimal-kicker">Topic</p>
        <h1>{topic.name}</h1>
      </header>
      <ol className="minimal-posts">
        {topic.posts.map((post) => (
          <li key={post.id}>
            <Link href={`/post/${post.slug}`}>
              <time dateTime={post.createdAt}>{formatShortDate(post.createdAt)}</time>
              <span>{post.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Post({ post }: ThemePostProps) {
  const toc = post.blocks.find((block) => block.type === "table_of_contents")?.toc;

  return (
    <article className="minimal-article">
      <header className="minimal-article-header">
        {post.coverUrl ? <img alt="" src={post.coverUrl} /> : null}
        <p className="minimal-kicker">{post.topic?.name ?? "Post"}</p>
        <h1>{post.title}</h1>
        <time dateTime={post.createdAt}>{formatLongDate(post.createdAt)}</time>
      </header>
      <div className={toc?.length ? "minimal-article-grid has-toc" : "minimal-article-grid"}>
        {toc?.length ? (
          <aside className="minimal-toc">
            <TableOfContents toc={toc} />
          </aside>
        ) : null}
        <div className="article-content minimal-article-content">
          <BlockRenderer blocks={post.blocks} />
        </div>
      </div>
    </article>
  );
}

export const minimalTheme: HydrotionTheme = {
  name: "minimal",
  Chrome,
  Home,
  Topic,
  Post
};
