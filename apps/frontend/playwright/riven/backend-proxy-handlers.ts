import { HttpResponse, http } from "msw/http";

import type { AnyHandler } from "msw";
import type { HttpResponseResolver } from "msw/http";

interface CreateBackendProxyHandlersInput {
  /** The worker's Riven, which the backend's requests are re-addressed to */
  rivenUrl: URL;

  /** The frontend's origin, which the browser sends its backend requests to */
  origin: string;

  /** The `BACKEND_URL` the Next.js server sends its backend requests to */
  backendUrl: string;

  /** Other origins the browser sends its backend requests to */
  extraOrigins?: string[];
}

/** Headers that only describe a single connection, so can't be forwarded to another one */
const hopByHopHeaders = [
  "connection",
  "host",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
];

/**
 * Headers that describe the body as it was sent, rather than as `fetch` returns it.
 * `fetch` decompresses the body, so forwarding these would make the browser decode it twice.
 */
const bodyEncodingHeaders = ["content-encoding", "content-length"];

const withoutHeaders = (source: Headers, names: string[]) => {
  // `Headers` copies every `set-cookie` header individually, rather than joining them
  const headers = new Headers(source);

  for (const name of names) {
    headers.delete(name);
  }

  return headers;
};

/**
 * Re-addresses the backend requests made by the browser and the Next.js server to the worker's Riven,
 * preserving their method, path, query, headers and body.
 */
export function createBackendProxyHandlers({
  rivenUrl,
  origin,
  backendUrl,
  extraOrigins = [],
}: CreateBackendProxyHandlersInput): AnyHandler[] {
  const forward: HttpResponseResolver = async ({ request }) => {
    const { pathname, search } = new URL(request.url);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    const response = await fetch(new URL(`${pathname}${search}`, rivenUrl), {
      method: request.method,
      headers: withoutHeaders(request.headers, hopByHopHeaders),
      body: hasBody ? await request.arrayBuffer() : null,
      // Redirects are the browser's to follow, so it keeps any cookies set along the way
      redirect: "manual",
    });

    return new HttpResponse(
      response.body ? await response.arrayBuffer() : null,
      {
        status: response.status,
        statusText: response.statusText,
        headers: withoutHeaders(response.headers, bodyEncodingHeaders),
      },
    );
  };

  return [origin, backendUrl, ...extraOrigins].flatMap((baseUrl) => [
    http.all(`${baseUrl}/graphql`, forward),
    http.all(`${baseUrl}/api/auth/*`, forward),
  ]);
}
