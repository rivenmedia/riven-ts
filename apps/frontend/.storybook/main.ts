import { defineMain } from "@storybook/nextjs-vite/node";
import { defineStorybookVis } from "storybook-addon-vis/node";

export default defineMain({
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@storybook/addon-mcp",
    defineStorybookVis({
      visProjects: [
        { snapshotRootDir: "__vis__/local" },
        { snapshotRootDir: "__vis__/linux" },
      ],
    }),
  ],
  stories: ["../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    componentsManifest: true,
    experimentalReview: true,
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
    experimentalReactComponentMeta: true,
  },
});
