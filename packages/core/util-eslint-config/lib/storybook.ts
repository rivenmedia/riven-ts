import storybook from "eslint-plugin-storybook";
import { defineConfig } from "eslint/config";

export const storybookEslintConfig = defineConfig([
  ...(storybook.configs["flat/recommended"] as never),
]);
