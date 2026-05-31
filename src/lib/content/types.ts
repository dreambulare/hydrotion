export type HydrotionRichText = {
  plainText: string;
  href: string | null;
  annotations: Record<string, boolean | string>;
};

export type HydrotionBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "divider"
  | "quote"
  | "callout"
  | "code"
  | "table"
  | "table_of_contents"
  | "image"
  | "image_external"
  | "video"
  | "video_external"
  | "video_youtube"
  | "file"
  | "numbered_list_item"
  | "numbered_list_item_group"
  | "bulleted_list_item"
  | "bulleted_list_item_group"
  | "unsupported";

export type HydrotionTocItem = {
  id: string;
  level: number;
  text: string;
};

export type HydrotionBlock = {
  id: string;
  type: HydrotionBlockType;
  originalType?: string;
  richText?: HydrotionRichText[];
  children?: HydrotionBlock[];
  items?: HydrotionBlock[];
  code?: string;
  language?: string;
  rows?: HydrotionRichText[][][];
  url?: string;
  caption?: HydrotionRichText[];
  mediaKind?: "notion-file" | "external";
  expiryTime?: string | null;
  toc?: HydrotionTocItem[];
};

export type HydrotionPostSummary = {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  topic: { id: string; name: string } | null;
  tags: Array<{ id: string; name: string; color: string }>;
};

export type HydrotionPost = HydrotionPostSummary & {
  iconUrl: string | null;
  coverUrl: string | null;
  blocks: HydrotionBlock[];
};

export type HydrotionSite = {
  title: string;
  description: string;
  iconUrl: string | null;
};

export type HydrotionTopic = {
  id: string;
  name: string;
  posts: HydrotionPostSummary[];
};

export type ParseOptions = {
  mediaUrlFactory: (input: { blockId: string; sourceUrl: string; kind: "file" | "external" }) => string;
};
