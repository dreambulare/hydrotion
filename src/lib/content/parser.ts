import type { HydrotionBlock, HydrotionRichText, HydrotionTocItem, ParseOptions } from "./types";

type NotionLikeBlock = {
  id?: unknown;
  type?: unknown;
  has_children?: unknown;
  [key: string]: unknown;
};

type NotionLikeRichText = {
  plain_text?: unknown;
  href?: unknown;
  annotations?: unknown;
  type?: unknown;
  text?: unknown;
  mention?: unknown;
};

const headingLevel: Record<string, number> = {
  heading_1: 1,
  heading_2: 2,
  heading_3: 3
};

const textBlockTypes = new Set([
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "quote",
  "callout",
  "numbered_list_item",
  "bulleted_list_item"
]);

export function parseNotionBlocks(blocks: unknown[], options: ParseOptions): HydrotionBlock[] {
  const parsed = groupAdjacentLists(blocks.map((block) => parseBlock(block, options)));
  const toc = collectToc(parsed);

  return parsed.map((block) => attachToc(block, toc));
}

function parseBlock(input: unknown, options: ParseOptions): HydrotionBlock {
  const block = asRecord(input) as NotionLikeBlock;
  const type = typeof block.type === "string" ? block.type : "unsupported";
  const id = typeof block.id === "string" ? block.id : "unknown";
  const payload = asRecord(block[type]);

  if (textBlockTypes.has(type)) {
    const children = parseInlineChildren(payload.children, options);
    return {
      id,
      type: type as HydrotionBlock["type"],
      richText: parseRichText(payload.rich_text),
      ...(children.length > 0 ? { children } : {})
    };
  }

  if (type === "divider") {
    return { id, type: "divider" };
  }

  if (type === "table_of_contents") {
    return { id, type: "table_of_contents", toc: [] };
  }

  if (type === "code") {
    return {
      id,
      type: "code",
      code: parseRichText(payload.rich_text)
        .map((item) => item.plainText)
        .join(""),
      language: typeof payload.language === "string" ? payload.language : "plain text",
      caption: parseRichText(payload.caption)
    };
  }

  if (type === "table") {
    return {
      id,
      type: "table",
      rows: parseTableRows(payload.children)
    };
  }

  if (type === "image") {
    return parseMediaBlock(id, "image", payload, options);
  }

  if (type === "video") {
    const parsed = parseMediaBlock(id, "video", payload, options);
    if (parsed.mediaKind === "external" && parsed.url && isYoutubeUrl(parsed.url)) {
      return { ...parsed, type: "video_youtube", url: extractYoutubeId(parsed.url) ?? parsed.url };
    }
    return parsed.mediaKind === "external" ? { ...parsed, type: "video_external" } : parsed;
  }

  if (type === "file") {
    return parseMediaBlock(id, "file", payload, options);
  }

  return { id, type: "unsupported", originalType: type };
}

function parseInlineChildren(input: unknown, options: ParseOptions) {
  if (!Array.isArray(input)) {
    return [];
  }

  return groupAdjacentLists(input.map((child) => parseBlock(child, options)));
}

function parseRichText(input: unknown): HydrotionRichText[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) => {
    const richText = asRecord(item) as NotionLikeRichText;
    return {
      plainText: typeof richText.plain_text === "string" ? richText.plain_text : "",
      href: typeof richText.href === "string" ? normalizeHref(richText.href) : null,
      annotations: parseAnnotations(richText.annotations)
    };
  });
}

function parseAnnotations(input: unknown) {
  const annotations = asRecord(input);
  const result: Record<string, boolean | string> = {};
  for (const [key, value] of Object.entries(annotations)) {
    if (typeof value === "boolean" || typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

function parseMediaBlock(
  id: string,
  outputType: "image" | "video" | "file",
  payload: Record<string, unknown>,
  options: ParseOptions
): HydrotionBlock {
  const mediaType = typeof payload.type === "string" ? payload.type : "unsupported";
  const filePayload = mediaType === "file" ? asRecord(payload.file) : asRecord(payload.external);
  const sourceUrl = typeof filePayload.url === "string" ? filePayload.url : "";

  if (mediaType === "file") {
    return {
      id,
      type: outputType,
      url: options.mediaUrlFactory({ blockId: id, sourceUrl, kind: "file" }),
      mediaKind: "notion-file",
      expiryTime: typeof filePayload.expiry_time === "string" ? filePayload.expiry_time : null,
      caption: parseRichText(payload.caption)
    };
  }

  if (mediaType === "external") {
    return {
      id,
      type: outputType === "image" ? "image_external" : outputType,
      url: sourceUrl,
      mediaKind: "external",
      caption: parseRichText(payload.caption)
    };
  }

  return { id, type: "unsupported", originalType: outputType };
}

function parseTableRows(input: unknown): HydrotionRichText[][][] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((row) => {
    const tableRow = asRecord(asRecord(row).table_row);
    const cells = Array.isArray(tableRow.cells) ? tableRow.cells : [];
    return cells.map((cell) => parseRichText(cell));
  });
}

function groupAdjacentLists(blocks: HydrotionBlock[]): HydrotionBlock[] {
  const grouped: HydrotionBlock[] = [];

  for (const block of blocks) {
    if (block.type !== "numbered_list_item" && block.type !== "bulleted_list_item") {
      grouped.push(block);
      continue;
    }

    const groupType = `${block.type}_group` as "numbered_list_item_group" | "bulleted_list_item_group";
    const previous = grouped[grouped.length - 1];
    if (previous?.type === groupType) {
      previous.items = [...(previous.items ?? []), block];
    } else {
      grouped.push({
        id: `${block.id}-group`,
        type: groupType,
        originalType: block.type,
        items: [block]
      });
    }
  }

  return grouped;
}

function collectToc(blocks: HydrotionBlock[]): HydrotionTocItem[] {
  const result: HydrotionTocItem[] = [];

  for (const block of blocks) {
    if (block.type in headingLevel) {
      result.push({
        id: block.id,
        level: headingLevel[block.type],
        text: (block.richText ?? []).map((item) => item.plainText).join("")
      });
    }

    if (block.children) {
      result.push(...collectToc(block.children));
    }

    if (block.items) {
      result.push(...collectToc(block.items));
    }
  }

  return result;
}

function attachToc(block: HydrotionBlock, toc: HydrotionTocItem[]): HydrotionBlock {
  return {
    ...block,
    ...(block.type === "table_of_contents" ? { toc } : {}),
    ...(block.children ? { children: block.children.map((child) => attachToc(child, toc)) } : {}),
    ...(block.items ? { items: block.items.map((item) => attachToc(item, toc)) } : {})
  };
}

function normalizeHref(href: string) {
  if (href.startsWith("/")) {
    return `https://notion.so${href}`;
  }

  return href;
}

function isYoutubeUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname === "youtube.com" || hostname === "youtu.be";
  } catch {
    return false;
  }
}

function extractYoutubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.replace(/^www\./, "") === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }

  return {};
}
