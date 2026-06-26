import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupState } from "@/src/components/SetupState";
import { getPost, getSite, getTopics, resolvePostId } from "@/src/lib/notion/repository";
import { getTheme } from "@/src/themes/registry";

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
  const theme = getTheme();

  return (
    <theme.Chrome site={site} topics={topics}>
      <theme.Post post={post} />
    </theme.Chrome>
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
