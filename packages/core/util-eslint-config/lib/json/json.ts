import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import * as tseslint from "typescript-eslint";

import { jsonFiles } from "../internal/file-types.ts";

export const jsonConfig = defineConfig({
  name: "riven:json",
  files: [jsonFiles],
  extends: [
    tseslint.configs.disableTypeChecked,
    {
      ...json.configs.recommended,
      files: ["**/*.json"],
      ignores: ["package-lock.json", "tsconfig*.json"],
      language: "json/json",
    },
    {
      ...json.configs.recommended,
      files: ["**/*.jsonc", "tsconfig*.json"],
      language: "json/jsonc",
    },
    {
      ...json.configs.recommended,
      files: ["**/*.json5"],
      language: "json/json5",
    },
  ],
});
