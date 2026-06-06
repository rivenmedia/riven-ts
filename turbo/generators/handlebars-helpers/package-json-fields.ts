import { toMerged } from "es-toolkit";

import type { PlopTypes } from "@turbo/gen";

type PackageType = "plugin" | "util" | "domain";

type PackageJsonDefinition = {
  scripts?: Record<string, string | null>;
  exports?: Record<string, string | Record<string, string | null> | null>;
  devDependencies?: Record<string, string | null>;
  dependencies?: Record<string, string | null>;
  peerDependencies?: Record<string, string | null>;
  files?: string[];
};

const packageTypeFields: Partial<
  Record<PackageType | "*", PackageJsonDefinition>
> = {
  "*": {
    exports: {
      ".": {
        production: "./dist/index.js",
        default: "./lib/index.ts",
      },
    },
    files: ["dist"],
    devDependencies: {
      "@repo/core-util-eslint-config": "workspace:^",
      "@repo/core-util-typescript-config": "workspace:^",
      "@repo/core-util-vitest-config": "workspace:^",
      "@types/node": "catalog:",
      "@typescript-eslint/parser": "catalog:",
      eslint: "catalog:",
      typescript: "catalog:",
      vitest: "catalog:",
    },
    scripts: {
      build: "tsc --project tsconfig.lib.json",
      "check-types":
        "tsc --noEmit --project tsconfig.lib.json && tsc --noEmit --project tsconfig.spec.json",
      lint: "eslint",
      "lint:fix": "pnpm lint --fix",
      test: "vitest run --passWithNoTests",
      "test:watch": "vitest",
    },
  },
  plugin: {
    exports: {
      "./wiki.config": "./wiki.config.ts",
    },
    scripts: {
      "codegen:config-docs": "pnpm node scripts/generate-zod-docs.ts",
    },
    dependencies: {
      "@repo/util-plugin-sdk": "workspace:^",
      "@repo/util-wiki-helpers": "workspace:^",
      "type-graphql": "catalog:",
      zod: "catalog:",
    },
    devDependencies: {
      "@repo/util-plugin-testing": "workspace:^",
      msw: "catalog:",
    },
  },
};

export function registerPackageJsonFieldsHelper(plop: PlopTypes.NodePlopAPI) {
  plop.setHelper(
    "packageJsonFields",
    function (
      this: Record<string, unknown>, // Handlebars context
      packageType: PackageType,
      packageJsonFieldType: keyof PackageJsonDefinition,
    ) {
      const fields = toMerged(
        packageTypeFields["*"]?.[packageJsonFieldType] ?? {},
        packageTypeFields[packageType]?.[packageJsonFieldType] ?? {},
      );

      if (Array.isArray(fields)) {
        return fields;
      }

      if (Object.keys(fields).length === 0) {
        return null;
      }

      // Process any template strings in the values
      const kebabCase = plop.getHelper("kebabCase");
      const processed: Record<string, unknown | null> = {};

      for (const [key, value] of Object.entries(fields)) {
        if (typeof value === "string" && value.includes("{{")) {
          // Replace {{kebabCase pluginName}} with actual value
          processed[key] = value.replace(
            /\{\{kebabCase (\w+)\}\}/g,
            (_, varName) => kebabCase(String(this[varName] ?? "")),
          );
        } else {
          processed[key] = value;
        }
      }

      return processed;
    },
  );
}
