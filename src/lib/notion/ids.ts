const NOTION_ID_PATTERN = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;

export function extractNotionDatabaseId(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const source = urlPathname(trimmed) ?? trimmed;
  const match = source.match(NOTION_ID_PATTERN);
  return match ? match[0].replaceAll("-", "").toLowerCase() : null;
}

function urlPathname(input: string) {
  try {
    return new URL(input).pathname;
  } catch {
    return null;
  }
}
