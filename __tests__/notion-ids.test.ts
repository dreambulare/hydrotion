import { describe, expect, it } from "vitest";
import { extractNotionDatabaseId } from "@/src/lib/notion/ids";

describe("extractNotionDatabaseId", () => {
  it("extracts the database id from a Notion app URL without using the view id", () => {
    expect(
      extractNotionDatabaseId("https://app.notion.com/p/be7763e8cfd54337be2eaf474af82c1c?v=2cd7e75b86b44e838a4b2d70d1d66708&pvs=12")
    ).toBe("be7763e8cfd54337be2eaf474af82c1c");
  });

  it("normalizes bare ids and hyphenated Notion ids", () => {
    expect(extractNotionDatabaseId("BE7763E8-CFD5-4337-BE2E-AF474AF82C1C")).toBe("be7763e8cfd54337be2eaf474af82c1c");
    expect(extractNotionDatabaseId("be7763e8cfd54337be2eaf474af82c1c")).toBe("be7763e8cfd54337be2eaf474af82c1c");
  });

  it("extracts ids from title-style Notion URLs", () => {
    expect(extractNotionDatabaseId("https://www.notion.so/workspace/Editorial-calendar-be7763e8cfd54337be2eaf474af82c1c")).toBe(
      "be7763e8cfd54337be2eaf474af82c1c"
    );
  });

  it("returns null when no database id is present", () => {
    expect(extractNotionDatabaseId("https://www.notion.so/workspace/home?v=2cd7e75b86b44e838a4b2d70d1d66708")).toBeNull();
  });
});
