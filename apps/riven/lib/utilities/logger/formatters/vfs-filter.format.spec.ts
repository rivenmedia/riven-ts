import { expect, it } from "vitest";

import { excludeVfsFormat, onlyVfsFormat } from "./vfs-filter.format.ts";

import type { TransformableInfo } from "logform";

const vfsLog = Object.freeze({
  level: "info",
  message: "vfs log",
  "riven.log.source": "vfs",
}) as unknown as TransformableInfo;

const programLog = Object.freeze({
  level: "info",
  message: "program log",
  "riven.log.source": "program",
}) as unknown as TransformableInfo;

it("excludes VFS logs whilst keeping other logs", () => {
  const format = excludeVfsFormat();

  expect(format.transform({ ...vfsLog })).toBe(false);
  expect(format.transform({ ...programLog })).toStrictEqual(programLog);
});

it("keeps only VFS logs", () => {
  const format = onlyVfsFormat();

  expect(format.transform({ ...vfsLog })).toStrictEqual(vfsLog);
  expect(format.transform({ ...programLog })).toBe(false);
});
