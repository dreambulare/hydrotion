import type { Metadata } from "next";
import { getPostSummaries, getSite, getTopics } from "@/src/lib/notion/repository";
import { getPageParam, paginateItems } from "@/src/lib/content/pagination";
import { Pagination } from "@/src/components/Pagination";
import { PostList } from "@/src/components/PostList";
import { SetupState } from "@/src/components/SetupState";
import { SiteChrome } from "@/src/components/SiteChrome";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const site = await getSite();
    const title = site.description ? `${site.title} - ${site.description}` : site.title;

    return {
      title: {
        absolute: title
      },
      description: site.description || undefined
    };
  } catch {
    return {};
  }
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const data = await loadHomeData();
  if (!data.ok) {
    return <SetupState error={data.error} />;
  }

  const { site, posts, topics } = data;
  const { page } = await searchParams;
  const pagination = paginateItems(posts, getPageParam(page));

  return (
    <SiteChrome site={site} topics={topics}>
      <section className="home-shell">
        <div className="home-intro">
          <h1>{site.title}</h1>
          {site.description ? <p>{site.description}</p> : null}
        </div>
        <PostList posts={pagination.items} />
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
      </section>
    </SiteChrome>
  );
}

async function loadHomeData() {
  try {
    const [site, posts, topics] = await Promise.all([getSite(), getPostSummaries(), getTopics()]);
    return { ok: true as const, site, posts, topics };
  } catch (error) {
    return { ok: false as const, error };
  }
}
