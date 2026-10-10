import { defaultClientConditions, defaultServerConditions } from "vite";

import type { UserConfig } from "vite";

/**
 * Resolves workspace packages to their TypeScript sources via the `@repo/source` export condition.
 *
 * Setting `resolve.conditions` replaces the defaults, so they are re-added here.
 * Server conditions match Vitest's defaults, which exclude `module`: Vitest also passes them to Node
 * as `--conditions`, where `module` would select ESM builds that Node can't load (e.g. `@opentelemetry/api`).
 */
export const sourceConditionsConfig = {
  resolve: {
    conditions: ["@repo/source", ...defaultClientConditions],
  },
  ssr: {
    resolve: {
      conditions: [
        "@repo/source",
        ...defaultServerConditions.filter(
          (condition) => condition !== "module",
        ),
      ],
    },
  },
} satisfies UserConfig;
