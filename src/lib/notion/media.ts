import type { ParseOptions } from "@/src/lib/content/types";

export function createMediaUrlFactory(): ParseOptions["mediaUrlFactory"] {
  return ({ blockId, sourceUrl, kind }) => {
    const params = new URLSearchParams({
      source: Buffer.from(sourceUrl).toString("base64url"),
      kind
    });
    return `/api/media/${encodeURIComponent(blockId)}?${params.toString()}`;
  };
}

export function notionFileUrlFromObject(input: unknown): { url: string | null; expiryTime: string | null; kind: "file" | "external" } {
  if (typeof input === "string" && input.trim()) {
    return {
      url: emojiToSvgDataUrl(input),
      expiryTime: null,
      kind: "external" as const
    };
  }

  const record = asRecord(input);
  if (record.type === "emoji" && typeof record.emoji === "string") {
    return {
      url: emojiToSvgDataUrl(record.emoji),
      expiryTime: null,
      kind: "external" as const
    };
  }

  if (record.type === "custom_emoji") {
    const customEmoji = asRecord(record.custom_emoji);
    return {
      url: typeof customEmoji.url === "string" ? customEmoji.url : null,
      expiryTime: null,
      kind: "external" as const
    };
  }

  if (record.type === "icon") {
    const icon = asRecord(record.icon);
    const name = typeof icon.name === "string" ? icon.name : "";
    const color = typeof icon.color === "string" ? icon.color : "default";
    return {
      url: notionIconToSvgDataUrl(name, color),
      expiryTime: null,
      kind: "external" as const
    };
  }

  if (record.type === "file") {
    const file = asRecord(record.file);
    return {
      url: typeof file.url === "string" ? file.url : null,
      expiryTime: typeof file.expiry_time === "string" ? file.expiry_time : null,
      kind: "file" as const
    };
  }

  if (record.type === "external") {
    const external = asRecord(record.external);
    return {
      url: typeof external.url === "string" ? external.url : null,
      expiryTime: null,
      kind: "external" as const
    };
  }

  return { url: null, expiryTime: null, kind: "external" as const };
}

function emojiToSvgDataUrl(emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="66" font-size="72" text-anchor="middle">${escapeXml(emoji)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function notionIconToSvgDataUrl(name: string, color: string) {
  const emoji = notionIconEmoji(name);
  if (emoji) {
    return emojiToSvgDataUrl(emoji);
  }

  const label = iconLabel(name);
  const ink = notionIconColor(color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="62" font-family="Arial, sans-serif" font-size="42" font-weight="700" text-anchor="middle" fill="${ink}">${escapeXml(label)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function notionIconEmoji(name: string) {
  const codePoints: Record<string, number[]> = {
    "alien-pixel": [0x1f47e],
    "book-open": [0x1f4d6],
    "calendar": [0x1f4c5],
    "camera": [0x1f4f7],
    "check": [0x2705],
    "clock": [0x23f0],
    "code": [0x1f4bb],
    "document": [0x1f4c4],
    "globe": [0x1f310],
    "heart": [0x2764, 0xfe0f],
    "home": [0x1f3e0],
    "image": [0x1f5bc, 0xfe0f],
    "lightbulb": [0x1f4a1],
    "link": [0x1f517],
    "mail": [0x2709, 0xfe0f],
    "pen": [0x270f, 0xfe0f],
    "star": [0x2b50],
    "tag": [0x1f3f7, 0xfe0f],
    "target": [0x1f3af],
    "user": [0x1f464]
  };
  const match = codePoints[name];
  return match ? String.fromCodePoint(...match) : "";
}

function iconLabel(name: string) {
  const initials = name
    .split("-")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "H";
}

function notionIconColor(color: string) {
  const colors: Record<string, string> = {
    blue: "#2f6f9f",
    brown: "#8a5a3b",
    default: "#2c2c2c",
    gray: "#6f6f6f",
    green: "#2f7d4f",
    lightgray: "#6f6f6f",
    orange: "#b45f18",
    pink: "#b5487d",
    purple: "#7657a8",
    red: "#b23a3a",
    yellow: "#9a6a00"
  };

  return colors[color] ?? colors.default;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }

  return {};
}
