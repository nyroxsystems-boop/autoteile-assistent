import fetch, { Response } from "node-fetch";

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retry?: number;
  retryDelayMs?: number;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeoutAndRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = Number(process.env.HTTP_TIMEOUT_MS || 10000),
    retry = Number(process.env.HTTP_RETRY_COUNT || 2),
    retryDelayMs = Number(process.env.HTTP_RETRY_DELAY_MS || 300),
    ...rest
  } = options;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await (fetch as any)(url, { ...rest, body: (rest as any)?.body ?? undefined, signal: controller.signal });
      clearTimeout(timeout);
      return resp;
    } catch (err: any) {
      clearTimeout(timeout);
      if (attempt > retry) throw err;
      await delay(retryDelayMs * attempt);
    }
  }
}
