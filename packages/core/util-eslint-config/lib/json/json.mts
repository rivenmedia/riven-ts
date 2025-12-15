import { jsonFiles } from "../internal/file-types.mts";
import type { ConfigArray } from "typescript-eslint";
import * as tseslint from "typescript-eslint";
import json from "@eslint/json";

export const jsonConfig = [
  {
    files: [jsonFiles],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ...json.configs.recommended,
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    language: "json/json",
  },
  {
    ...json.configs.recommended,
    files: ["**/*.jsonc"],
    language: "json/jsonc",
  },
  {
    ...json.configs.recommended,
    files: ["**/*.json5"],
    language: "json/json5",
  },
] as const satisfies ConfigArray;
