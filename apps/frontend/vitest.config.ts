import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { storybookVis } from "storybook-addon-vis/vitest-plugin";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import type { Plugin, ViteUserConfig } from "vitest/config";
import type { BrowserCommand, Reporter, TestModule, Vitest } from "vitest/node";

/**
 * Resizes the browser page that hosts the test iframe.
 *
 * Vitest scales the iframe down when it's larger than the page, so the page must grow along with it for full page snapshots.
 */
const setBrowserViewport: BrowserCommand<
  [width: number, height: number]
> = async ({ page }, width, height) => {
  await page.setViewportSize({ width, height });
};

/**
 * Snapshot mismatches still write the result, so only other failures leave a snapshot untaken.
 *
 * Storybook prefixes the error with a link to the story, so the message is matched from any line.
 */
const isSnapshotMismatch = ({ message }: { message: string }) =>
  /^Snapshot `[^`]+` /mu.test(message);

const isMissingSnapshots = (testModule: TestModule) =>
  testModule.errors().length > 0 ||
  [...testModule.children.allSuites()].some(
    (suite) => suite.errors().length > 0,
  ) ||
  [...testModule.children.allTests("failed")].some((test) =>
    test.result().errors?.some((error) => !isSnapshotMismatch(error)),
  );

/**
 * Records whether every component test took its snapshot, in a file per shard.
 *
 * A test that fails before its snapshot writes no result, so its baseline looks unused to the visual regression check,
 * which only checks for unused baselines when every shard took all of its snapshots.
 */
class SnapshotRunReporter implements Reporter {
  #vitest: Vitest | undefined;

  public onInit(vitest: Vitest) {
    this.#vitest = vitest;
  }

  public async onTestRunEnd(
    ...[testModules, unhandledErrors, reason]: Parameters<
      NonNullable<Reporter["onTestRunEnd"]>
    >
  ) {
    const componentTestModules = testModules.filter(
      (testModule) => testModule.project.config.browser.enabled,
    );

    if (!this.#vitest || componentTestModules.length === 0) {
      return;
    }

    const testFilesMissingSnapshots = componentTestModules
      .filter(isMissingSnapshots)
      .map((testModule) => testModule.relativeModuleId);
    const { shard } = this.#vitest.config;
    const visDir = path.join(import.meta.dirname, "__vis__");

    await mkdir(visDir, { recursive: true });
    await writeFile(
      path.join(
        visDir,
        shard
          ? `component-test-run-${String(shard.index)}-of-${String(shard.count)}.json`
          : "component-test-run.json",
      ),
      JSON.stringify({
        allSnapshotsTaken:
          reason !== "interrupted" &&
          unhandledErrors.length === 0 &&
          testFilesMissingSnapshots.length === 0,
        testFilesMissingSnapshots,
      }),
    );
  }
}

export default defineConfig((config) => {
  const baseConfig = baseVitestConfig(config);

  return mergeConfig<typeof baseConfig, ViteUserConfig>(baseConfig, {
    plugins: [react()],
    test: {
      // Setting reporters replaces Vitest's defaults, so these are kept alongside the snapshot run reporter
      ...(process.env["CI"] && {
        reporters: [
          "default",
          ...(process.env["GITHUB_ACTIONS"] === "true"
            ? ["github-actions"]
            : []),
          new SnapshotRunReporter(),
        ],
      }),
      coverage: {
        exclude: [".next/**", "playwright/**", "playwright-report/**"],
      },
      projects: [
        {
          extends: true,
          define: {
            "import.meta.env.CI": JSON.stringify(process.env["CI"] ?? ""),
          },
          plugins: [
            storybookTest({
              configDir: path.join(import.meta.dirname, ".storybook"),
              storybookScript: "pnpm storybook --ci",
            }),
            storybookVis({
              diffOptions: {
                threshold: 0.1,
              },
              // A percentage lets taller snapshots change more, hiding changes such as a larger font across a full page
              failureThresholdType: "pixel",
              failureThreshold: 0,
            }) as Plugin,
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              commands: { setBrowserViewport },
              provider: playwright({
                launchOptions: {
                  // Use the new Chromium headless mode
                  // https://vitest.dev/config/browser/playwright#launchoptions
                  channel: "chromium",
                  // Text is antialiased in greyscale wherever it is composited separately (e.g. while animating), so use it everywhere,
                  // rather than snapshots depending on whether an element had its own layer when captured
                  args: ["--disable-lcd-text"],
                },
                contextOptions: {
                  reducedMotion: "reduce",
                  deviceScaleFactor: 1,
                  locale: "en-GB",
                  timezoneId: "UTC",
                  // Matches Storybook's default story viewport, so the test iframe isn't scaled down to fit
                  viewport: {
                    width: 1200,
                    height: 900,
                  },
                },
              }),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
            retry: 0, // Prefer to fail for component tests as flakiness causes baseline regeneration
            setupFiles: ["./.storybook/vitest.setup.ts"],
            testTimeout: 30_000,
          },
        },
        {
          test: {
            name: "unit",
            environment: "jsdom",
            exclude: [
              ...configDefaults.exclude,
              // Exclude Playwright test files
              "tests/**",
            ],
            setupFiles: ["./vitest.setup.ts"],
          },
        },
      ],
    },
  });
});
