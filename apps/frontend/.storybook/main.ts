import { sourceConditionsConfig } from "@repo/core-util-vitest-config/source-conditions";

import { defineMain } from "@storybook/nextjs-vite/node";
import { defineStorybookVis } from "storybook-addon-vis/node";
import { mergeConfig } from "vite";

export default defineMain({
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    defineStorybookVis(),
  ],
  stories: ["../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  viteFinal: (config) => mergeConfig(config, sourceConditionsConfig),
  features: {
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
  },
});
