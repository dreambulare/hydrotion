import type { Metadata } from "next";
import { getPostSummaries, getSite, getTopics } from "@/src/lib/notion/repository";
import { getPageParam, paginateItems } from "@/src/lib/content/pagination";
import { SetupState } from "@/src/components/SetupState";
import { getTheme } from "@/src/themes/registry";

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
  const theme = getTheme();

  return (
    <theme.Chrome site={site} topics={topics}>
      <theme.Home site={site} posts={pagination.items} pagination={pagination} />
    </theme.Chrome>
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
