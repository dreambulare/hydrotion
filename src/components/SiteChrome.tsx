import Link from "next/link";
import type { HydrotionSite, HydrotionTopic } from "@/src/lib/content/types";

export function SiteChrome({ site, topics, children }: { site: HydrotionSite; topics: HydrotionTopic[]; children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <SiteIcon site={site} />
          <span>{site.title}</span>
        </Link>
        <nav aria-label="Topics">
          {topics.map((topic) => (
            <Link href={`/topic/${topic.id}`} key={topic.id}>
              {topic.name}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <a href="https://github.com/dreambulare/hydrotion">Hydrotion</a>
        <span>Notion-backed publishing with cache-first rendering.</span>
      </footer>
    </>
  );
}

function SiteIcon({ site }: { site: HydrotionSite }) {
  if (site.iconUrl) {
    return <img alt="" className="brand-icon" src={site.iconUrl} />;
  }

  return <span className="brand-mark">{site.title.slice(0, 1).toUpperCase()}</span>;
}
