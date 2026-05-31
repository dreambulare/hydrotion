export const visibleBlocksFixture = [
  {
    object: "block",
    id: "visible-title",
    type: "heading_1",
    heading_1: {
      rich_text: [{ type: "text", plain_text: "Visible Title", href: null, annotations: { bold: true, color: "default" } }]
    },
    has_children: false
  },
  {
    object: "block",
    id: "visible-paragraph",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", plain_text: "A paragraph with a link.", href: "https://example.com", annotations: { color: "default" } }]
    },
    has_children: false
  },
  {
    object: "block",
    id: "visible-bullet-1",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", plain_text: "First item", href: null, annotations: { color: "default" } }]
    },
    has_children: false
  },
  {
    object: "block",
    id: "visible-bullet-2",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", plain_text: "Second item", href: null, annotations: { color: "default" } }]
    },
    has_children: false
  },
  {
    object: "block",
    id: "visible-toc",
    type: "table_of_contents",
    table_of_contents: {},
    has_children: false
  },
  {
    object: "block",
    id: "visible-image",
    type: "image",
    image: {
      type: "file",
      file: {
        url: "https://prod-files-secure.s3.us-west-2.amazonaws.com/example/image.png?X-Amz-Expires=3600",
        expiry_time: "2026-05-30T22:30:00.000Z"
      }
    },
    has_children: false
  }
] as const;

export const hiddenBlocksFixture = [
  {
    object: "block",
    id: "hidden-heading",
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", plain_text: "Hidden Section", href: null, annotations: { italic: true, color: "default" } }]
    },
    has_children: false
  },
  {
    object: "block",
    id: "hidden-number-1",
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: [{ type: "text", plain_text: "One", href: null, annotations: { color: "default" } }],
      children: [
        {
          object: "block",
          id: "hidden-child",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", plain_text: "Nested child", href: null, annotations: { color: "default" } }]
          },
          has_children: false
        }
      ]
    },
    has_children: true
  },
  {
    object: "block",
    id: "hidden-number-2",
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: [{ type: "text", plain_text: "Two", href: null, annotations: { color: "default" } }]
    },
    has_children: false
  },
  {
    object: "block",
    id: "hidden-video",
    type: "video",
    video: {
      type: "external",
      external: {
        url: "https://youtu.be/dQw4w9WgXcQ"
      }
    },
    has_children: false
  },
  {
    object: "block",
    id: "hidden-embed",
    type: "embed",
    embed: {
      url: "https://example.com/embed"
    },
    has_children: false
  },
  {
    object: "block",
    id: "hidden-toc",
    type: "table_of_contents",
    table_of_contents: {},
    has_children: false
  }
] as const;
