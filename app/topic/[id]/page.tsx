import { notFound } from "next/navigation";
import { SetupState } from "@/src/components/SetupState";
import { getSite, getTopics } from "@/src/lib/notion/repository";
import { getTheme } from "@/src/themes/registry";

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
  const theme = getTheme();

  return (
    <theme.Chrome site={site} topics={topics}>
      <theme.Topic topic={topic} />
    </theme.Chrome>
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
