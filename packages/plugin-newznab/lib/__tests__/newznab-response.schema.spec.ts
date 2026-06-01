import assert from "node:assert";
import { describe, expect, it } from "vitest";

import { filterAndSortCandidates as filterFn } from "../datasource/newznab.datasource.ts";
import {
  NewznabItem,
  NewznabResponse,
  getAttrValue,
  getItemSizeBytes,
} from "../schemas/newznab-response.schema.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeAttr = (name: string, value: string) => ({
  "@attributes": { name, value },
});

const makeItem = (
  overrides: Partial<{
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    category: string;
    sizeBytes: number;
  }> = {},
) => ({
  title: overrides.title ?? "Some NZB Title",
  link: overrides.link ?? "https://indexer.example.com/nzb/123",
  guid: overrides.guid ?? "123",
  pubDate: overrides.pubDate ?? "Tue, 25 Feb 2025 12:34:56 +0000",
  category: overrides.category ?? "5040",
  attr: [
    makeAttr("size", String(overrides.sizeBytes ?? 5 * 1024 * 1024 * 1024)),
  ],
});

// ---------------------------------------------------------------------------
// NewznabItem
// ---------------------------------------------------------------------------

describe("NewznabItem", () => {
  it("parses a full item with an array of attrs", () => {
    const raw = makeItem({ sizeBytes: 2_000_000_000 });
    const result = NewznabItem.safeParse(raw);
    assert(result.success);
    expect(result.data.attr).toHaveLength(1);
    expect(result.data.attr[0]?.["@attributes"].name).toBe("size");
  });

  it("normalises a single attr object (not array) to an array", () => {
    const raw = {
      title: "Test",
      link: "https://indexer.example.com/nzb/1",
      guid: "1",
      pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
      attr: makeAttr("size", "1000000"),
    };

    const result = NewznabItem.safeParse(raw);
    assert(result.success);
    expect(Array.isArray(result.data.attr)).toBe(true);
    expect(result.data.attr).toHaveLength(1);
  });

  it("coerces a numeric attr.value to a string (SABnzbd-style indexer)", () => {
    // Real-world regression: some Newznab implementations (SABnzbd-integrated
    // indexers) emit numeric `value` for the size attr instead of string.
    // Without coercion, the attr was silently dropped and the item got
    // filtered out for "0 bytes", with no warning.
    const raw = {
      title: "Numeric size",
      link: "https://indexer.example.com/nzb/numeric",
      guid: "num",
      pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
      attr: [{ "@attributes": { name: "size", value: 5_368_709_120 } }],
    };

    const result = NewznabItem.safeParse(raw);
    assert(result.success);
    // Value must be coerced to its string form so getItemSizeBytes parseInt
    // works as expected downstream.
    expect(result.data.attr[0]?.["@attributes"].value).toBe("5368709120");
    expect(getItemSizeBytes(result.data)).toBe(5_368_709_120);
  });

  it("normalises missing attr to an empty array", () => {
    const raw = {
      title: "Test",
      link: "https://indexer.example.com/nzb/2",
      guid: "2",
      pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
    };

    const result = NewznabItem.safeParse(raw);
    assert(result.success);
    expect(result.data.attr).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// NewznabResponse
// ---------------------------------------------------------------------------

describe("NewznabResponse", () => {
  it("parses a multi-item response (array)", () => {
    const raw = {
      channel: {
        response: { "@attributes": { offset: "0", total: "2" } },
        item: [
          makeItem({ sizeBytes: 1_000_000_000 }),
          makeItem({ sizeBytes: 2_000_000_000 }),
        ],
      },
    };

    const result = NewznabResponse.safeParse(raw);
    assert(result.success);
    expect(result.data.channel.item).toHaveLength(2);
  });

  it("normalises a single-item response (object) to an array", () => {
    const raw = {
      channel: {
        response: { "@attributes": { offset: "0", total: "1" } },
        item: makeItem({ sizeBytes: 1_000_000_000 }),
      },
    };

    const result = NewznabResponse.safeParse(raw);
    assert(result.success);
    expect(result.data.channel.item).toHaveLength(1);
  });

  it("normalises missing item field to an empty array", () => {
    const raw = {
      channel: {
        response: { "@attributes": { offset: "0", total: "0" } },
      },
    };

    const result = NewznabResponse.safeParse(raw);
    assert(result.success);
    expect(result.data.channel.item).toEqual([]);
  });

  it("rejects a response with no channel field", () => {
    const result = NewznabResponse.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAttrValue / getItemSizeBytes
// ---------------------------------------------------------------------------

describe("getAttrValue", () => {
  it("returns the value for a matching attribute name", () => {
    const parsed = NewznabItem.parse(makeItem({ sizeBytes: 3_000_000_000 }));
    expect(getAttrValue(parsed, "size")).toBe("3000000000");
  });

  it("returns undefined when the attribute is not present", () => {
    const parsed = NewznabItem.parse(makeItem({ sizeBytes: 1_000_000 }));
    expect(getAttrValue(parsed, "category")).toBeUndefined();
  });
});

describe("getItemSizeBytes", () => {
  it("returns the size from the size attr", () => {
    const parsed = NewznabItem.parse(makeItem({ sizeBytes: 7_000_000_000 }));
    expect(getItemSizeBytes(parsed)).toBe(7_000_000_000);
  });

  it("returns 0 when no size attr is present", () => {
    const raw = {
      title: "No size",
      link: "https://indexer.example.com/nzb/3",
      guid: "3",
      pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
    };
    const parsed = NewznabItem.parse(raw);
    expect(getItemSizeBytes(parsed)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// filterAndSortCandidates (pure function from datasource)
// ---------------------------------------------------------------------------

describe("filterAndSortCandidates", () => {
  const INDEXER_URL = "https://indexer.example.com";
  const MIN = 100 * 1024 * 1024; // 100 MB
  const MAX = 100 * 1024 * 1024 * 1024; // 100 GB

  const makeResponse = (items: ReturnType<typeof makeItem>[]) =>
    NewznabResponse.parse({ channel: { item: items } });

  it("returns an empty array when the channel has no items", () => {
    const response = NewznabResponse.parse({ channel: {} });
    expect(filterFn(response, INDEXER_URL, MIN, MAX)).toEqual([]);
  });

  it("filters out items below minSizeBytes", () => {
    const tinyItem = makeItem({ sizeBytes: 1024 }); // 1 KB
    const response = makeResponse([tinyItem]);
    expect(filterFn(response, INDEXER_URL, MIN, MAX)).toEqual([]);
  });

  it("filters out items above maxSizeBytes", () => {
    const hugeItem = makeItem({ sizeBytes: 200 * 1024 * 1024 * 1024 }); // 200 GB
    const response = makeResponse([hugeItem]);
    expect(filterFn(response, INDEXER_URL, MIN, MAX)).toEqual([]);
  });

  it("accepts items exactly at the minSizeBytes boundary", () => {
    const item = makeItem({ sizeBytes: MIN });
    const response = makeResponse([item]);
    const results = filterFn(response, INDEXER_URL, MIN, MAX);
    expect(results).toHaveLength(1);
    expect(results[0]?.size).toBe(MIN);
  });

  it("accepts items exactly at the maxSizeBytes boundary", () => {
    const item = makeItem({ sizeBytes: MAX });
    const response = makeResponse([item]);
    const results = filterFn(response, INDEXER_URL, MIN, MAX);
    expect(results).toHaveLength(1);
    expect(results[0]?.size).toBe(MAX);
  });

  it("sorts candidates by publishDate descending (newest first)", () => {
    const older = makeItem({
      sizeBytes: 2 * 1024 * 1024 * 1024,
      pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
      title: "Older",
    });
    const newer = makeItem({
      sizeBytes: 2 * 1024 * 1024 * 1024,
      pubDate: "Tue, 25 Feb 2025 12:34:56 +0000",
      title: "Newer",
    });
    const response = makeResponse([older, newer]);
    const results = filterFn(response, INDEXER_URL, MIN, MAX);
    expect(results[0]?.title).toBe("Newer");
    expect(results[1]?.title).toBe("Older");
  });

  it("limits results to 10 candidates", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeItem({
        sizeBytes: 2 * 1024 * 1024 * 1024,
        title: `Item ${i.toString()}`,
        guid: i.toString(),
        link: `https://indexer.example.com/nzb/${i.toString()}`,
      }),
    );
    const response = makeResponse(items);
    const results = filterFn(response, INDEXER_URL, MIN, MAX);
    expect(results).toHaveLength(10);
  });

  it("populates the indexer field with the provided indexerUrl", () => {
    const item = makeItem({ sizeBytes: 2 * 1024 * 1024 * 1024 });
    const response = makeResponse([item]);
    const results = filterFn(response, INDEXER_URL, MIN, MAX);
    expect(results[0]?.indexer).toBe(INDEXER_URL);
  });

  it("falls back to item.category when size attr is absent and uses category field", () => {
    // Item has no size attr — getItemSizeBytes returns 0, filtered out
    const raw = {
      channel: {
        item: [
          {
            title: "Cat only",
            link: "https://indexer.example.com/nzb/99",
            guid: "99",
            pubDate: "Mon, 01 Jan 2024 00:00:00 +0000",
            category: "5040",
            // no attr
          },
        ],
      },
    };
    const response = NewznabResponse.parse(raw);
    // Size will be 0, below MIN — should be filtered out
    expect(filterFn(response, INDEXER_URL, MIN, MAX)).toEqual([]);
  });
});
