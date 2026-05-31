import "server-only";
import { Client } from "@notionhq/client";
import { requireNotionEnv } from "@/src/lib/config/env";

export const notionVersion = "2026-03-11";

let notionClient: Client | null = null;

export function getNotionClient() {
  if (!notionClient) {
    const env = requireNotionEnv();
    notionClient = new Client({
      auth: env.NOTION_TOKEN,
      notionVersion
    });
  }

  return notionClient;
}

export async function withNotionRetry<T>(operation: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 429 && attempt < 4) {
      const retryAfter = getRetryAfter(error);
      await sleep(Math.max(retryAfter, 1) * 1000);
      return withNotionRetry(operation, attempt + 1);
    }

    throw error;
  }
}

function getErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return error.status;
  }

  if (error && typeof error === "object" && "code" in error && error.code === "rate_limited") {
    return 429;
  }

  return null;
}

function getRetryAfter(error: unknown) {
  if (error && typeof error === "object" && "headers" in error) {
    const headers = error.headers;
    if (headers instanceof Headers) {
      return Number(headers.get("retry-after") ?? 1);
    }
  }

  return 1;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
