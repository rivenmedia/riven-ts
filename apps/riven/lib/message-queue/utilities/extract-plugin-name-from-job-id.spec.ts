import { describe, expect, it } from "vitest";

import { extractPluginNameFromJobId } from "./extract-plugin-name-from-job-id.ts";

describe("extractPluginNameFromJobId", () => {
  it("extracts plugin name from a valid job ID", () => {
    expect(extractPluginNameFromJobId("queue:plugin[my-plugin]:event")).toBe(
      "my-plugin",
    );
  });

  it("extracts plugin name case-insensitively", () => {
    expect(extractPluginNameFromJobId("Plugin[TestPlugin]")).toBe("TestPlugin");
  });

  it("throws when no plugin name in job ID", () => {
    expect(() => extractPluginNameFromJobId("invalid-job-id")).toThrow(
      "Could not extract plugin name from job ID",
    );
  });
});
