import { defineMain } from "@storybook/nextjs-vite/node";

const fakerSeed = process.env["STORYBOOK_FAKER_SEED"];

export default defineMain({
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook",
  ],
  stories: ["../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
  },
  env: fakerSeed ? { STORYBOOK_FAKER_SEED: fakerSeed } : {},
  tags: {
    "test-fn": {
      defaultFilterSelection:
        process.env["STORYBOOK_EXCLUDE_TESTS"] === "true"
          ? "exclude"
          : "include",
    },
  },
});
