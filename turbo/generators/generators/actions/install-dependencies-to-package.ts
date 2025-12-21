import { spawn } from "node:child_process";
import type { PackageJson } from "type-fest";

export const installDependenciesToPackage = (
  targetPackage: string,
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

  return new Promise<string>((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        `--filter=${targetPackage}`,
        "add",
        ...args[dependencyType],
        ...Object.entries(dependencies).map(
          ([name, version]) => `${name}@${version}`,
        ),
      ],
      {
        stdio: "inherit",
      },
    );

    child.on("close", (code) =>
      code === 0
        ? resolve("Dependencies installation complete.")
        : reject(new Error(`Installation process exited with code ${code}`)),
    );

    child.on("error", (err) =>
      reject(new Error(`Installation encountered an error: ${err.message}`)),
    );
  });
};
