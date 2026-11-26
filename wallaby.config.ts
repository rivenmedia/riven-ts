import { testCodePatterns } from "@repo/core-util-vitest-config/base";

export default function wallabyConfig() {
  return {
    autoDetect: true,
    tests: {
      override: (testPatterns: string[]) => [
        ...testPatterns,
        // Wallaby ignores the frontend's Vitest excludes, so it'd otherwise load the Playwright tests and report them as global errors
        "!apps/frontend/tests/**",
      ],
    },
    filesWithNoCoverageCalculated: [
      // Test code (specs, mocks, fixtures, Playwright helpers) shouldn't count towards Wallaby's coverage totals.
      ...testCodePatterns,
      "packages/util-plugin-testing/**",
      "packages/plugin-test/**",
    ],
  };
}
