import type { PlopTypes } from "@turbo/gen";

type PackageType = "plugin" | "util" | "domain";

type DependencyType = "devDependencies" | "dependencies" | "peerDependencies";

type DependencyMap = Partial<Record<DependencyType, Record<string, string>>>;

const commonDependencies: DependencyMap = {
  devDependencies: {
    "@repo/core-util-eslint-config": "workspace:^",
    "@repo/core-util-logger": "workspace:^",
    "@repo/core-util-typescript-config": "workspace:^",
    "@repo/core-util-vitest-config": "workspace:^",
    "@repo/core-util-vitest-test-context": "workspace:^",
    "@types/node": "catalog:",
    "@typescript-eslint/parser": "catalog:",
    eslint: "catalog:",
    typescript: "catalog:",
    vitest: "catalog:",
  },
};

const packageTypeDependencies: Partial<Record<PackageType, DependencyMap>> = {
  plugin: {
    dependencies: {
      "@apollo/datasource-rest": "catalog:",
      "@repo/core-util-datasource": "workspace:^",
      "type-graphql": "catalog:",
      zod: "catalog:",
    },
  },
};

export function registerPackageDependenciesHelper(plop: PlopTypes.NodePlopAPI) {
  plop.addHelper(
    "packageDependencies",
    function (packageType: PackageType, dependencyType: DependencyType) {
      const dependencies = {
        ...commonDependencies[dependencyType],
        ...(packageTypeDependencies[packageType]?.[dependencyType] ?? {}),
      };

      if (Object.keys(dependencies).length === 0) {
        return null;
      }

      return dependencies;
    },
  );
}
