import type { HydrotionBlock } from "@/src/lib/content/types";
import { RichText } from "./RichText";

export function BlockRenderer({ blocks }: { blocks: HydrotionBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <BlockView block={block} key={block.id} />
      ))}
    </>
  );
}

function BlockView({ block }: { block: HydrotionBlock }) {
  switch (block.type) {
    case "heading_1":
      return <h1 id={block.id}>{<RichText value={block.richText} />}</h1>;
    case "heading_2":
      return <h2 id={block.id}>{<RichText value={block.richText} />}</h2>;
    case "heading_3":
      return <h3 id={block.id}>{<RichText value={block.richText} />}</h3>;
    case "paragraph":
      return (
        <>
          <p><RichText value={block.richText} /></p>
          {renderChildren(block)}
        </>
      );
    case "divider":
      return <hr />;
    case "quote":
      return <blockquote><RichText value={block.richText} /></blockquote>;
    case "callout":
      return <aside className="callout"><RichText value={block.richText} /></aside>;
    case "code":
      return (
        <pre>
          <code data-language={block.language}>{block.code}</code>
        </pre>
      );
    case "table_of_contents":
      return null;
    case "numbered_list_item_group":
      return (
        <ol>
          {(block.items ?? []).map((item) => (
            <li key={item.id}><RichText value={item.richText} />{renderChildren(item)}</li>
          ))}
        </ol>
      );
    case "bulleted_list_item_group":
      return (
        <ul>
          {(block.items ?? []).map((item) => (
            <li key={item.id}><RichText value={item.richText} />{renderChildren(item)}</li>
          ))}
        </ul>
      );
    case "image":
    case "image_external":
      return block.url ? <img alt="" className="article-media" src={block.url} /> : null;
    case "video":
    case "video_external":
      return block.url ? <video className="article-media" controls src={block.url} /> : null;
    case "video_youtube":
      return block.url ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="youtube-frame"
          src={`https://www.youtube.com/embed/${block.url}`}
          title="Embedded YouTube video"
        />
      ) : null;
    case "file":
      return block.url ? <a className="file-link" href={block.url}>Download file</a> : null;
    case "table":
      return <Table block={block} />;
    default:
      return <div className="unsupported">Unsupported Notion block: {block.originalType ?? "unknown"}</div>;
  }
}

export function TableOfContents({ toc }: { toc: HydrotionBlock["toc"] }) {
  if (!toc?.length) {
    return null;
  }

  return (
    <nav className="toc" aria-label="Table of contents">
      <p>Contents</p>
      {toc.map((item) => (
        <a className={`toc-level-${item.level}`} href={`#${item.id}`} key={`${item.id}-${item.text}`}>
          {item.text}
        </a>
      ))}
    </nav>
  );
}

function Table({ block }: { block: HydrotionBlock }) {
  return (
    <div className="table-scroll">
      <table>
        <tbody>
          {(block.rows ?? []).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}><RichText value={cell} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderChildren(block: HydrotionBlock) {
  return block.children?.length ? <div className="nested-blocks"><BlockRenderer blocks={block.children} /></div> : null;
}
