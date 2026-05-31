export function SetupState({ error }: { error: unknown }) {
  return (
    <main className="setup-state">
      <p className="eyebrow">Hydrotion</p>
      <h1>Connect a Notion data source.</h1>
      <p>
        Set <code>NOTION_TOKEN</code> and <code>NOTION_DATA_SOURCE_ID</code>, or provide <code>NOTION_DATABASE_ID</code> as a database ID or URL for automatic data source discovery.
      </p>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
    </main>
  );
}
