import { testCodePatterns } from "@repo/core-util-vitest-config/base";

export default function wallabyConfig() {
  return {
    autoDetect: true,
    filesWithNoCoverageCalculated: [
      // Test code (specs, mocks, fixtures, Playwright helpers) shouldn't count towards Wallaby's coverage totals.
      ...testCodePatterns,
      "packages/util-plugin-testing/**",
      "packages/plugin-test/**",
    ],
  };
}
