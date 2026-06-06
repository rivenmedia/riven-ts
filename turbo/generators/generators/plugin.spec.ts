import { execa } from "execa";
import { readdirSync } from "node:fs";
import { it as baseIt, expect } from "vitest";

import type { PackageJson } from "type-fest";

const it = baseIt
  .extend("startDiff", { auto: true, scope: "file" }, async () => {
    const { stdout } = await execa`git diff HEAD --name-only`;
    const filesChanged = stdout
      .trim()
      .split("\n")
      .filter((file) => file && !file.startsWith("turbo/"));

    return filesChanged;
  })
  .extend("packageType", { scope: "file" }, "plugin")
  .extend("packageName", { scope: "file" }, `test-plugin-generator`)
  .extend(
    "packageFullName",
    { scope: "file" },
    ({ packageType, packageName }) => `@repo/${packageType}-${packageName}`,
  )
  .extend(
    "packageDir",
    { scope: "file" },
    ({ packageType, packageName }) =>
      `${process.cwd()}/packages/${packageType}-${packageName}`,
  );

it.beforeAll(async ({ startDiff, packageName }) => {
  if (startDiff.length) {
    expect.fail(
      "Uncommitted changes detected. Please clean your working directory before running this test.",
    );
  }

  await execa`turbo gen plugin --args ${packageName} y`;
});

it.afterAll(async ({ startDiff, packageDir }) => {
  await execa`rm -rf ${packageDir}`;

  const { stdout } = await execa`git diff HEAD --name-only`;
  const filesChanged = stdout
    .trim()
    .split("\n")
    .filter(
      (file) => file && !file.startsWith("turbo/") && !startDiff.includes(file),
    );

  for (const changedFile of filesChanged) {
    await execa`git restore -- ${changedFile}`;
  }
}, 60_000);

it.concurrent("generates a plugin", ({ packageDir }) => {
  const contents = readdirSync(packageDir);

  expect(contents).toContain("lib");
  expect(contents).toContain("package.json");
});

it.concurrent("generates the wiki config", ({ packageDir }) => {
  const packageJson: PackageJson = require(`${packageDir}/package.json`);
  const contents = readdirSync(packageDir);

  expect(packageJson.exports).toHaveProperty(
    "./wiki.config",
    "./wiki.config.ts",
  );
  expect(contents).toContain("wiki.config.ts");
});

it.concurrent(
  "adds the plugin as a dependency to @repo/wiki",
  ({ packageFullName }) => {
    const packageJson: PackageJson = require(
      `${process.cwd()}/apps/wiki/package.json`,
    );

    expect(packageJson.dependencies).toHaveProperty(
      packageFullName,
      "workspace:^",
    );
  },
);

it.concurrent(
  "adds the plugin as a dependency to @repo/riven",
  ({ packageFullName }) => {
    const packageJson: PackageJson = require(
      `${process.cwd()}/apps/riven/package.json`,
    );

    expect(packageJson.dependencies).toHaveProperty(
      packageFullName,
      "workspace:^",
    );
  },
);

it.concurrent(
  "generates a plugin with the correct name in package.json",
  ({ packageFullName, packageDir }) => {
    const packageJson = require(`${packageDir}/package.json`);

    expect(packageJson.name).toBe(packageFullName);
  },
);

it.concurrent.for([
  "test",
  "lint",
  "check-types",
  "build",
  "codegen:config-docs",
] as const)(
  "passes pnpm %s",
  { timeout: 60_000 },
  async (command, { packageFullName }) => {
    await expect(
      execa`pnpm --filter ${packageFullName} ${command}`,
    ).resolves.toBeTruthy();
  },
);
