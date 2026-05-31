# Hydrotion Content Harness

This harness exists before application code so generated or refactored content code can be tested in isolation.

It validates the contract for converting Notion API block payloads into Hydrotion's internal article AST. The harness is intentionally smaller than the full app runtime and does not call Notion, Next.js, or external networks.

## Scope

- Environment and dependency expectations.
- Prompt prefix and function signature for generated content parser code.
- Execution wrapper that builds a temporary TypeScript program from a completion.
- Visible and hidden test cases with assertions for block parsing, list grouping, table of contents, nested children, and expiring media references.

## Command

```bash
pnpm harness -- --completion ./path/to/completion.ts
```

If `--completion` is omitted, the harness runs against the project parser exported from `src/lib/content/parser.ts`.
