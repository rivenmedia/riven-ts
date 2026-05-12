import {
  type ConfigArray,
  baseEslintConfig,
} from "@repo/core-util-eslint-config";

import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";

import svelteConfig from "./svelte.config.js";

export default [
  ...baseEslintConfig,
  // Constrain the svelte recommended config to only `.svelte` files so the
  // plugin's rules don't try to read parserServices on JSON/JS/TS files.
  ...svelte.configs["flat/recommended"].map((c) => ({
    ...c,
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
  })),
  {
    // Point the typescript-eslint project service at apps/dashboard's own
    // tsconfig rather than the eslint-config package's directory.
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Inside .svelte files, the script block is TypeScript; we hand it to
    // typescript-eslint's parser via svelte-eslint-parser, the same wiring
    // riven-frontend uses.
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
        svelteConfig,
      },
    },
    rules: {
      // SvelteKit 2's `resolve()` typed-route helper is the recommended
      // pattern for `goto()` and `href={...}`. The dashboard is an internal
      // dev tool with no typed-routes ambition yet; flip this back on if we
      // ever enable the SvelteKit type-safe paths feature.
      "svelte/no-navigation-without-resolve": "off",
      // `$state` + `$effect` for SSR-load reconciliation is the pattern Agents
      // D and E used; it works correctly and matches the existing convention
      // in riven-frontend. `$derived.by` is preferred in isolation, but
      // mixing it with locally-mutated state from a search input adds noise.
      "svelte/prefer-writable-derived": "off",
    },
  },
  {
    // shadcn-svelte primitives are copy-pasted from the registry and not
    // worth linting in this repo; matches riven-frontend's ignore list.
    // Config files at the package root aren't in SvelteKit's auto-generated
    // tsconfig so the typescript-eslint project service can't see them;
    // they're config, not application code, so excluding them is fine.
    ignores: [
      ".svelte-kit/**",
      "build/**",
      "node_modules/**",
      "src/lib/components/ui/**",
      "src/lib/graphql/__generated__/**",
      "**/*.typegen.ts",
      "eslint.config.ts",
      "graphql-codegen.ts",
      "scripts/**",
    ],
  },
] satisfies ConfigArray;
