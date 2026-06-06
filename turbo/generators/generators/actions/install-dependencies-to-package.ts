import { $ } from "execa";

import { installDependenciesAction } from "./install-dependencies.ts";

import type { PackageJson } from "type-fest";

export const installDependenciesToPackages = async (
  targetPackages: string[],
  dependencyType: keyof Pick<
    PackageJson.PackageJsonStandard,
    "dependencies" | "devDependencies" | "peerDependencies"
  >,
  dependencies: PackageJson.Dependency,
) => {
  const args = {
    dependencies: ["--save-prod"],
    devDependencies: ["--save-dev"],
    peerDependencies: ["--save-peer"],
  } satisfies Record<typeof dependencyType, string[]>;

  const { exitCode } = await $("pnpm", [
    ...targetPackages.map((targetPackage) => `--filter=${targetPackage}`),
    "add",
    ...args[dependencyType],
    ...Object.entries(dependencies).map(
      ([name, version]) => `${name}@${version}`,
    ),
  ]);

  if (exitCode && exitCode !== 0) {
    throw new Error(`Failed to add dependencies: ${exitCode}`);
  }

  return installDependenciesAction();
};
