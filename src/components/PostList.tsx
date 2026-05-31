import Link from "next/link";
import type { HydrotionPostSummary } from "@/src/lib/content/types";

export function PostList({ posts }: { posts: HydrotionPostSummary[] }) {
  return (
    <ol className="post-list">
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/post/${post.slug}`}>
            <span>{post.title}</span>
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Undated";
  }

  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(date);
}
