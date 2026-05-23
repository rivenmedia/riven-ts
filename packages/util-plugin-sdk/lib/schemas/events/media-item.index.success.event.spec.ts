import { describe, expect, it } from "vitest";

import { MediaItemIndexSuccessEvent } from "./media-item.index.success.event.ts";

describe("MediaItemIndexSuccessEvent", () => {
  const sourceField = MediaItemIndexSuccessEvent.shape.source;

  it("defaults `source` to 'request' when undefined", () => {
    expect(sourceField.parse(undefined)).toBe("request");
  });

  it("accepts `source: 'reindex'`", () => {
    expect(sourceField.parse("reindex")).toBe("reindex");
  });

  it("accepts `source: 'request'`", () => {
    expect(sourceField.parse("request")).toBe("request");
  });

  it("rejects unknown source values", () => {
    expect(() => sourceField.parse("nonsense")).toThrow();
  });
});
