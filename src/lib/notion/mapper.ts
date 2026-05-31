import type { HydrotionPost, HydrotionPostSummary, HydrotionSite } from "@/src/lib/content/types";
import { parseNotionBlocks } from "@/src/lib/content/parser";
import { createMediaUrlFactory, notionFileUrlFromObject } from "./media";

export function mapSite(dataSource: unknown): HydrotionSite {
  const source = asRecord(dataSource);
  const title = getPlainText(source.title) || getString(source.name) || "Hydrotion";
  const description = getPlainText(source.description);
  const icon = notionFileUrlFromObject(source.icon);
  const mediaUrlFactory = createMediaUrlFactory();

  return {
    title,
    description,
    iconUrl: icon.kind === "file" && icon.url ? mediaUrlFactory({ blockId: "site:icon", sourceUrl: icon.url, kind: "file" }) : icon.url
  };
}

export function mapPostSummary(page: unknown): HydrotionPostSummary {
  const record = asRecord(page);
  const properties = asRecord(record.properties);
  const title = getTitle(properties.Name) || "Untitled";
  const createdAt = getDate(properties["Original Create Time"]) || getCreatedTime(properties["Create Time"]) || getString(record.created_time);
  const updatedAt = getLastEditedTime(properties["Update Time"]) || getString(record.last_edited_time) || createdAt;
  const topic = getTopic(properties.Topic);

  return {
    id: getString(record.id),
    title,
    slug: slugify(title, getString(record.id)),
    createdAt,
    updatedAt,
    topic,
    tags: getTags(properties.Tags)
  };
}

export function mapPost(page: unknown, blocks: unknown[]): HydrotionPost {
  const summary = mapPostSummary(page);
  const record = asRecord(page);
  const icon = notionFileUrlFromObject(record.icon);
  const cover = notionFileUrlFromObject(record.cover);
  const mediaUrlFactory = createMediaUrlFactory();

  return {
    ...summary,
    iconUrl: icon.kind === "file" && icon.url ? mediaUrlFactory({ blockId: `${summary.id}:icon`, sourceUrl: icon.url, kind: "file" }) : icon.url,
    coverUrl: cover.kind === "file" && cover.url ? mediaUrlFactory({ blockId: `${summary.id}:cover`, sourceUrl: cover.url, kind: "file" }) : cover.url,
    blocks: parseNotionBlocks(blocks, {
      mediaUrlFactory
    })
  };
}

function getTitle(input: unknown) {
  const title = asRecord(input).title;
  if (!Array.isArray(title)) {
    return "";
  }

  return title.map((item) => getString(asRecord(item).plain_text) || getString(asRecord(asRecord(item).text).content)).join("");
}

function getDate(input: unknown) {
  const date = asRecord(asRecord(input).date);
  return getString(date.start);
}

function getCreatedTime(input: unknown) {
  return getString(asRecord(input).created_time);
}

function getLastEditedTime(input: unknown) {
  return getString(asRecord(input).last_edited_time);
}

function getTopic(input: unknown) {
  const select = asRecord(asRecord(input).select);
  const id = getString(select.id);
  const name = getString(select.name);
  return id && name ? { id, name } : null;
}

function getTags(input: unknown) {
  const tags = asRecord(input).multi_select;
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map((tag) => {
    const record = asRecord(tag);
    return {
      id: getString(record.id),
      name: getString(record.name),
      color: getString(record.color) || "default"
    };
  });
}

function getPlainText(input: unknown) {
  if (Array.isArray(input)) {
    return input.map((item) => getString(asRecord(item).plain_text)).join("");
  }

  return getString(input);
}

function slugify(title: string, fallback: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallback.replaceAll("-", "");
}

function getString(input: unknown) {
  return typeof input === "string" ? input : "";
}

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }

  return {};
}
