import type { JobState } from "./job-states.ts";
import type { Route } from "next";

export function queueHref(
  queueName: string,
  options: { state?: JobState; page?: number } = {},
): Route {
  const search = new URLSearchParams();

  if (options.state) {
    search.set("state", options.state);
  }

  if (options.page !== undefined && options.page > 1) {
    search.set("page", String(options.page));
  }

  const query = search.toString();

  const base = `/queues/${encodeURIComponent(queueName)}`;

  return (query ? `${base}?${query}` : base) as Route;
}

export function jobHref(queueName: string, jobId: string): Route {
  return `/queues/${encodeURIComponent(queueName)}/jobs/${encodeURIComponent(jobId)}` as Route;
}

/** Decodes a dynamic route param, returning it unchanged if malformed. */
export function decodeRouteParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

/** Parses a `page` search param into a positive integer, defaulting to 1. */
export function parsePageParam(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9]\d*$/u.test(value)) {
    return 1;
  }

  return Number(value);
}
