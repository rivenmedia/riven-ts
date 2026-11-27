import { expect, it } from "vitest";

import {
  decodeRouteParam,
  jobHref,
  parsePageParam,
  queueHref,
} from "./queue-routes.ts";

const torrentio = "riven.media-item.scrape.requested.plugin[torrentio]";
const encodedTorrentio =
  "riven.media-item.scrape.requested.plugin%5Btorrentio%5D";

it("encodes the queue name in the queue href", () => {
  expect(queueHref(torrentio)).toBe(`/queues/${encodedTorrentio}`);
});

it.for([
  [{ state: "failed", page: 2 }, "/queues/scrape-item?state=failed&page=2"],
  [{ state: "failed", page: 1 }, "/queues/scrape-item?state=failed"],
] as const)("builds the queue href for %j as %s", ([options, expected]) => {
  expect(queueHref("scrape-item", options)).toBe(expected);
});

it.for([
  ["scrape-item", "48213", "/queues/scrape-item/jobs/48213"],
  ["q", "a/b", "/queues/q/jobs/a%2Fb"],
] as const)(
  "builds the job href for %s and %s as %s",
  ([queue, id, expected]) => {
    expect(jobHref(queue, id)).toBe(expected);
  },
);

it.for([
  [encodedTorrentio, torrentio],
  [torrentio, torrentio],
  ["%E0%A4%A", "%E0%A4%A"],
] as const)("decodes the route param %s as %s", ([param, expected]) => {
  expect(decodeRouteParam(param)).toBe(expected);
});

it.for([
  ["3", 3],
  [undefined, 1],
  ["0", 1],
  ["-3", 1],
  ["abc", 1],
  ["2.5", 1],
  [["2", "3"], 1],
] as const)("parses the page param %j as %i", ([value, expected]) => {
  expect(parsePageParam(value as string | string[] | undefined)).toBe(expected);
});
