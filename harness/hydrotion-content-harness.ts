import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { visibleBlocksFixture, hiddenBlocksFixture } from "./notion-block-fixtures";

type HarnessCase = {
  name: string;
  input: readonly unknown[];
  expected: {
    types: string[];
    tocTexts: string[];
    mediaKinds: string[];
  };
};

type HarnessResult =
  | { ok: true; caseCount: number }
  | { ok: false; kind: "SyntaxError" | "RuntimeError" | "TimeoutError"; message: string };

const timeoutMs = 5000;
const memoryMb = 192;

const promptPrefix = `
export type HydrotionRichText = {
  plainText: string;
  href: string | null;
  annotations: Record<string, boolean | string>;
};

export type HydrotionBlock = {
  id: string;
  type: string;
  richText?: HydrotionRichText[];
  children?: HydrotionBlock[];
  items?: HydrotionBlock[];
  url?: string;
  mediaKind?: "notion-file" | "external";
  toc?: Array<{ id: string; level: number; text: string }>;
};

export type ParseOptions = {
  mediaUrlFactory: (input: { blockId: string; sourceUrl: string; kind: "file" | "external" }) => string;
};
`;

const functionSignature = `
/**
 * Expected function signature:
 * export function parseNotionBlocks(blocks: unknown[], options: ParseOptions): HydrotionBlock[];
 *
 * Convert a flat list of Notion block API objects into HydrotionBlock AST nodes.
 *
 * Requirements:
 * - Preserve block ids.
 * - Convert paragraph, headings, quote, callout, code, divider, table_of_contents,
 *   numbered_list_item, bulleted_list_item, image, video, file, and unsupported blocks.
 * - Group adjacent list items of the same list type into list_group nodes.
 * - Fill table_of_contents nodes with headings from the full parsed document.
 * - Convert Notion-hosted file URLs through mediaUrlFactory because those URLs expire.
 * - Keep external media URLs external unless mediaUrlFactory chooses otherwise.
 *
 * Example:
 * parseNotionBlocks([{ id: "h1", type: "heading_1", heading_1: { rich_text: [{ plain_text: "Title" }] } }], options)
 * returns [{ id: "h1", type: "heading_1", richText: [{ plainText: "Title", href: null, annotations: {} }] }]
 */
`;

const projectParserUrl = pathToFileURL(path.resolve(import.meta.dirname, "../src/lib/content/parser.ts")).href;

const defaultCompletion = `
import { parseNotionBlocks } from "${projectParserUrl}";
`;

const cases: HarnessCase[] = [
  {
    name: "visible mixed document",
    input: visibleBlocksFixture,
    expected: {
      types: ["heading_1", "paragraph", "bulleted_list_item_group", "table_of_contents", "image"],
      tocTexts: ["Visible Title"],
      mediaKinds: ["notion-file"]
    }
  },
  {
    name: "hidden nested and external document",
    input: hiddenBlocksFixture,
    expected: {
      types: ["heading_2", "numbered_list_item_group", "video_youtube", "unsupported", "table_of_contents"],
      tocTexts: ["Hidden Section"],
      mediaKinds: ["external"]
    }
  }
];

function parseArgs(argv: string[]) {
  const completionIndex = argv.indexOf("--completion");
  return {
    completionPath: completionIndex >= 0 ? argv[completionIndex + 1] : null
  };
}

function buildHarnessScript(completion: string) {
  return `
${promptPrefix}
${functionSignature}
${completion}

const cases = ${JSON.stringify(cases)};
const options = {
  mediaUrlFactory(input) {
    return "/api/media/" + encodeURIComponent(input.blockId) + "?kind=" + input.kind;
  }
};

for (const testCase of cases) {
  const parsed = parseNotionBlocks(testCase.input, options);
  const flattenedTypes = JSON.stringify(parsed.map((block) => block.type));
  const expectedTypes = JSON.stringify(testCase.expected.types);
  if (flattenedTypes !== expectedTypes) {
    throw new Error(testCase.name + ": expected top-level types " + expectedTypes + " but received " + flattenedTypes);
  }

  const tocTexts = parsed.flatMap((block) => block.toc ?? []).map((item) => item.text);
  const expectedTocTexts = testCase.expected.tocTexts;
  for (const expectedText of expectedTocTexts) {
    if (!tocTexts.includes(expectedText)) {
      throw new Error(testCase.name + ": missing TOC text " + expectedText);
    }
  }

  const mediaKinds = parsed.flatMap((block) => block.mediaKind ? [block.mediaKind] : []);
  for (const expectedKind of testCase.expected.mediaKinds) {
    if (!mediaKinds.includes(expectedKind)) {
      throw new Error(testCase.name + ": missing media kind " + expectedKind);
    }
  }
}
`;
}

async function runScript(scriptPath: string): Promise<HarnessResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--max-old-space-size=" + memoryMb, "--import", "tsx", scriptPath], {
      cwd: path.resolve(import.meta.dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ ok: false, kind: "TimeoutError", message: `Harness exceeded ${timeoutMs}ms.` });
    }, timeoutMs);

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ ok: true, caseCount: cases.length });
        return;
      }

      const kind = stderr.includes("SyntaxError") ? "SyntaxError" : "RuntimeError";
      resolve({ ok: false, kind, message: stderr.trim() || `Process exited with code ${code}.` });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const completion = args.completionPath ? await readFile(args.completionPath, "utf8") : defaultCompletion;
  const dir = await mkdtemp(path.join(tmpdir(), "hydrotion-harness-"));
  const scriptPath = path.join(dir, "candidate.ts");

  try {
    await writeFile(scriptPath, buildHarnessScript(completion), "utf8");
    const result = await runScript(scriptPath);
    if (!result.ok) {
      console.error(`[${result.kind}] ${result.message}`);
      process.exit(1);
    }

    console.log(`Harness passed ${result.caseCount} cases.`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[RuntimeError] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
