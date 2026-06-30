import eslintPluginNext from "@next/eslint-plugin-next";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

import { jsFiles, tsFiles } from "./internal/file-types.ts";

import type { ConfigArray } from "typescript-eslint";

export const nextJsEslintConfig: ConfigArray = defineConfig([
  {
    name: "riven:nextjs",
    files: [jsFiles, tsFiles],
    extends: [
      eslintPluginNext.configs.recommended,
      eslintPluginReact.configs.flat["recommended"] ?? {},
      eslintPluginReact.configs.flat["jsx-runtime"] ?? {},
      eslintPluginReactHooks.configs.flat["recommended-latest"],
      eslintPluginJsxA11y.flatConfigs.strict,
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    name: "riven:nextjs:app-routes",
    files: ["app/**/{page,layout,loading,error,skeleton}.tsx"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
]);
