import { describe, expect, it } from "vitest";
import { notionFileUrlFromObject } from "@/src/lib/notion/media";
import { mapSite } from "@/src/lib/notion/mapper";

describe("notionFileUrlFromObject", () => {
  it("converts Notion built-in icons to transparent SVG data URLs", () => {
    const icon = notionFileUrlFromObject({
      type: "icon",
      icon: {
        name: "alien-pixel",
        color: "lightgray"
      }
    });

    expect(icon.kind).toBe("external");
    expect(icon.url).toMatch(/^data:image\/svg\+xml;base64,/);

    const svg = Buffer.from(icon.url?.split(",")[1] ?? "", "base64").toString("utf8");
    expect(svg).toContain("text");
    expect(svg).not.toContain("<rect");
  });

  it("routes expiring site icons through the media proxy", () => {
    const site = mapSite({
      name: "Hydrotion",
      icon: {
        type: "file",
        file: {
          url: "https://example.com/notion-icon.png",
          expiry_time: "2026-05-31T15:00:00.000Z"
        }
      }
    });

    expect(site.iconUrl).toContain("/api/media/site%3Aicon?");
    expect(site.iconUrl).toContain("source=");
  });
});
