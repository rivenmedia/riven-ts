import { describe, expect, it } from "vitest";

import { classifyHistoryStatus } from "../altmount.datasource.ts";

describe("classifyHistoryStatus", () => {
  it('returns "completed" for status "Completed"', () => {
    const result = classifyHistoryStatus("Completed", undefined);
    expect(result).toEqual({ kind: "completed" });
  });

  it('returns "failed" with fail_message for status "Failed"', () => {
    const result = classifyHistoryStatus("Failed", "missing articles");
    expect(result).toEqual({ kind: "failed", message: "missing articles" });
  });

  it('returns "failed" with default message when fail_message is undefined', () => {
    const result = classifyHistoryStatus("Failed", undefined);
    expect(result).toEqual({ kind: "failed", message: "no reason given" });
  });

  it('returns "still-running" for unknown status strings', () => {
    expect(classifyHistoryStatus("Verifying", undefined)).toEqual({
      kind: "still-running",
    });
    expect(classifyHistoryStatus("Extracting", undefined)).toEqual({
      kind: "still-running",
    });
    expect(classifyHistoryStatus("Repairing", undefined)).toEqual({
      kind: "still-running",
    });
  });

  it("is case-sensitive (SAB convention uses TitleCase)", () => {
    expect(classifyHistoryStatus("completed", undefined)).toEqual({
      kind: "still-running",
    });
    expect(classifyHistoryStatus("COMPLETED", undefined)).toEqual({
      kind: "still-running",
    });
  });
});
