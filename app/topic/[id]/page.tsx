import { notFound } from "next/navigation";
import { PostList } from "@/src/components/PostList";
import { SetupState } from "@/src/components/SetupState";
import { SiteChrome } from "@/src/components/SiteChrome";
import { getSite, getTopics } from "@/src/lib/notion/repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TopicPage({ params }: Props) {
  const data = await loadTopicData(params);
  if (!data.ok) {
    return <SetupState error={data.error} />;
  }

  const { site, topics, topic } = data;
  if (!topic) {
    notFound();
  }

  return (
    <SiteChrome site={site} topics={topics}>
      <section className="topic-shell">
        <p className="eyebrow">Topic</p>
        <h1>{topic.name}</h1>
        <PostList posts={topic.posts} />
      </section>
    </SiteChrome>
  );
}

async function loadTopicData(params: Props["params"]) {
  try {
    const { id } = await params;
    const [site, topics] = await Promise.all([getSite(), getTopics()]);
    const topic = topics.find((item) => item.id === id);
    return { ok: true as const, site, topics, topic };
  } catch (error) {
    return { ok: false as const, error };
  }
}
