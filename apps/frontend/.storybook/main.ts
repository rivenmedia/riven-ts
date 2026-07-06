import { defineMain } from "@storybook/nextjs-vite/node";

export default defineMain({
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
  stories: ["../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
  },
});
