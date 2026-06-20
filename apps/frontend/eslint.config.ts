import { baseEslintConfig } from "@repo/core-util-eslint-config";
import { createSvelteEslintConfig } from "@repo/core-util-eslint-config/svelte";
import { createTypescriptEslintConfig } from "@repo/core-util-eslint-config/typescript";

import { includeIgnoreFile } from "eslint/config";
import { defineConfig } from "eslint/config";
import { fileURLToPath } from "node:url";

import svelteConfig from "./svelte.config.ts";

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  createSvelteEslintConfig(svelteConfig),
  baseEslintConfig,
  createTypescriptEslintConfig(import.meta.dirname),
  { ignores: ["src/lib/components/ui/**"] },
);
