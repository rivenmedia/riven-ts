import type { PlopTypes } from "@turbo/gen";

type PackageType = "plugin" | "util" | "domain";

type PackageJsonDefinition = {
  scripts?: Record<string, string | null>;
  exports?: Record<string, string | Record<string, string | null> | null>;
  devDependencies?: Record<string, string | null>;
  dependencies?: Record<string, string | null>;
  peerDependencies?: Record<string, string | null>;
};

const commonFields: PackageJsonDefinition = {
  exports: {
    ".": "./lib/index.ts",
  },
  devDependencies: {
    "@repo/core-util-eslint-config": "workspace:^",
    "@repo/core-util-logger": "workspace:^",
    "@repo/core-util-typescript-config": "workspace:^",
    "@repo/core-util-vitest-config": "workspace:^",
    "@types/node": "catalog:",
    "@typescript-eslint/parser": "catalog:",
    eslint: "catalog:",
    msw: "catalog:",
    typescript: "catalog:",
    vitest: "catalog:",
  },
};

const packageTypeFields: Partial<Record<PackageType, PackageJsonDefinition>> = {
  plugin: {
    dependencies: {
      "@apollo/datasource-rest": "catalog:",
      "@repo/core-util-datasource": "workspace:^",
      "type-graphql": "catalog:",
      zod: "catalog:",
    },
    exports: {
      "./datasource": "./lib/datasource/{{kebabCase pluginName}}.datasource.ts",
    },
  },
};

export function registerPackageJsonFieldsHelper(plop: PlopTypes.NodePlopAPI) {
  plop.addHelper(
    "packageJsonFields",
    function (
      this: Record<string, unknown>, // Handlebars context
      packageType: PackageType,
      packageJsonFieldType: keyof PackageJsonDefinition,
    ) {
      const fields = {
        ...commonFields[packageJsonFieldType],
        ...(packageTypeFields[packageType]?.[packageJsonFieldType] ?? {}),
      };

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
