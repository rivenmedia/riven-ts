import { execa } from "execa";
import { readdirSync } from "node:fs";
import { it as baseIt, expect } from "vitest";

const packageName = "vitest-test-package";

const it = baseIt.extend(
  "startDiff",
  { auto: true, scope: "file" },
  async () => {
    const { stdout } = await execa`git diff HEAD --name-only`;
    const filesChanged = stdout
      .split("\n")
      .filter((file) => !file.startsWith("turbo/"));

    return filesChanged;
  },
);

it.beforeAll(async ({ startDiff }) => {
  if (startDiff.length) {
    expect.fail(
      "Uncommitted changes detected. Please clean your working directory before running this test.",
    );
  }

  await execa`turbo gen package --args ${packageName} util y`;
});

it.afterAll(async ({ startDiff }) => {
  const { stdout } = await execa`git diff HEAD --name-only`;
  const filesChanged = stdout
    .split("\n")
    .filter((file) => !file.startsWith("turbo/") && !startDiff.includes(file));

  if (filesChanged.length) {
    await execa`git reset -- ${filesChanged.join(" ")}`;
  }
});

it("generates a package", () => {
  const contents = readdirSync(`packages/util-${packageName}`);

  expect(contents).toContain("lib");
  expect(contents).toContain("package.json");
});
