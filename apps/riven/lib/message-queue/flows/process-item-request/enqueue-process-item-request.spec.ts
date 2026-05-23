import { describe, expect, it } from "vitest";

import { ProcessItemRequestFlow } from "./process-item-request.schema.ts";

describe("ProcessItemRequestFlow input", () => {
  const sourceField = ProcessItemRequestFlow.shape.input.shape.source;

  it("defaults `source` to 'request' when undefined", () => {
    expect(sourceField.parse(undefined)).toBe("request");
  });

  it("accepts `source: 'reindex'`", () => {
    expect(sourceField.parse("reindex")).toBe("reindex");
  });

  it("rejects unknown source values", () => {
    expect(() => sourceField.parse("nonsense")).toThrow();
  });
});
