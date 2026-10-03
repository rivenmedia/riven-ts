import { defineMain } from "@storybook/nextjs-vite/node";
import { defineStorybookVis } from "storybook-addon-vis/node";

import { containerSnapshotRootDir, localSnapshotRootDir } from "./vis-paths.ts";

export default defineMain({
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    // Shows the baseline, result and diff for each story in the "Vis" panel
    defineStorybookVis({
      visProjects: [
        { snapshotRootDir: containerSnapshotRootDir },
        { snapshotRootDir: localSnapshotRootDir },
      ],
    }),
  ],
  stories: ["../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
  },
});
