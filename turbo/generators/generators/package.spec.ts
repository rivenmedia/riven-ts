import { execa } from "execa";
import { readdirSync } from "node:fs";
import { it as baseIt, expect } from "vitest";

const it = baseIt
  .extend("startDiff", { auto: true, scope: "file" }, async () => {
    const { stdout } = await execa`git diff HEAD --name-only`;
    const filesChanged = stdout
      .trim()
      .split("\n")
      .filter((file) => file && !file.startsWith("turbo/"));

    return filesChanged;
  })
  .extend("packageType", { scope: "file" }, "util")
  .extend("packageName", { scope: "file" }, "test-package-generator")
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

it.beforeAll(async ({ startDiff, packageName, packageType }) => {
  if (startDiff.length) {
    expect.fail(
      "Uncommitted changes detected. Please clean your working directory before running this test.",
    );
  }

  await execa`turbo gen package --args ${packageName} ${packageType} y`;
}, 60_000);

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
});

it.concurrent("generates a package", ({ packageDir }) => {
  const contents = readdirSync(packageDir);

  expect(contents).toContain("lib");
  expect(contents).toContain("package.json");
});

it.concurrent(
  "generates a package with the correct name in package.json",
  ({ packageFullName, packageDir }) => {
    const packageJson = require(`${packageDir}/package.json`);

    expect(packageJson.name).toBe(packageFullName);
  },
);

it.concurrent.for(["test", "lint", "check-types", "build"] as const)(
  "passes pnpm %s",
  { timeout: 60_000 },
  async (command, { packageFullName }) => {
    await expect(
      execa`pnpm --filter ${packageFullName} ${command}`,
    ).resolves.toBeTruthy();
  },
);
