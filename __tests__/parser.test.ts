import { describe, expect, it } from "vitest";
import { parseNotionBlocks } from "@/src/lib/content/parser";
import { hiddenBlocksFixture, visibleBlocksFixture } from "@/harness/notion-block-fixtures";

const options = {
  mediaUrlFactory: ({ blockId }: { blockId: string }) => `/api/media/${blockId}`
};

describe("parseNotionBlocks", () => {
  it("groups adjacent list items and fills table of contents", () => {
    const parsed = parseNotionBlocks([...visibleBlocksFixture], options);
    expect(parsed.map((block) => block.type)).toEqual([
      "heading_1",
      "paragraph",
      "bulleted_list_item_group",
      "table_of_contents",
      "image"
    ]);
    expect(parsed[3].toc?.map((item) => item.text)).toEqual(["Visible Title"]);
  });

  it("converts expiring Notion media URLs through the media factory", () => {
    const parsed = parseNotionBlocks([...visibleBlocksFixture], options);
    const image = parsed.find((block) => block.type === "image");
    expect(image?.url).toBe("/api/media/visible-image");
    expect(image?.mediaKind).toBe("notion-file");
  });

  it("supports nested children and YouTube embeds", () => {
    const parsed = parseNotionBlocks([...hiddenBlocksFixture], options);
    const listGroup = parsed.find((block) => block.type === "numbered_list_item_group");
    const video = parsed.find((block) => block.type === "video_youtube");
    expect(listGroup?.items?.[0].children?.[0].type).toBe("paragraph");
    expect(video?.url).toBe("dQw4w9WgXcQ");
  });
});
