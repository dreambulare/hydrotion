import Link from "next/link";

export default function NotFound() {
  return (
    <main className="setup-state">
      <p className="eyebrow">404</p>
      <h1>Page not found.</h1>
      <p>The requested Notion page is not published or cannot be reached.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
