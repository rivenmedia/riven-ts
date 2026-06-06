import { $ } from "execa";

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

  const { code: pnpmAddCode } = await $("pnpm", [
    ...targetPackages.map((targetPackage) => `--filter=${targetPackage}`),
    "add",
    ...args[dependencyType],
    ...Object.entries(dependencies).map(
      ([name, version]) => `${name}@${version}`,
    ),
  ]);

  if (pnpmAddCode && pnpmAddCode !== 0) {
    throw new Error(`Failed to add dependencies: ${pnpmAddCode}`);
  }

  const { code: pnpmInstallCode } = await $`pnpm install`;

  if (pnpmInstallCode && pnpmInstallCode !== 0) {
    throw new Error(`Failed to install dependencies: ${pnpmInstallCode}`);
  }

  return "Dependencies installation complete.";
};
