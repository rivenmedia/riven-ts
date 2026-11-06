import { UnrecoverableError } from "bullmq";
import { expect, it } from "vitest";

import { createConsoleFormat } from "./console.format.ts";

import type { TransformableInfo } from "logform";

function render(info: Partial<TransformableInfo>, showStackTraces = true) {
  const formatted = createConsoleFormat({ showStackTraces }).transform({
    "@timestamp": "2026-07-23T23:44:01.000Z",
    "ecs.version": "8.10.0",
    "log.level": "error",
    level: "error",
    ...info,
  } as TransformableInfo);

  expect.assert(typeof formatted === "object");

  const message = formatted[Symbol.for("message")];

  expect.assert(typeof message === "string");

  return message;
}

it("omits the stack trace for expected errors", () => {
  const error = new UnrecoverableError(
    "Failed to download Big Buck Bunny: No valid torrent found after trying all downloaders",
  );

  expect.assert(error.stack);

  const output = render({
    message: "download-item failed:",
    error: {
      name: error.name,
      type: error.name,
      message: error.message,
      stack_trace: error.stack,
    },
  });

  expect(output).toContain(
    "download-item failed: Failed to download Big Buck Bunny: No valid torrent found after trying all downloaders",
  );

  expect(output).not.toContain("    at ");
});

it("keeps the stack trace for unexpected errors", () => {
  const error = new TypeError("Cannot read properties of undefined");

  expect.assert(error.stack);

  const output = render({
    message: "download-item failed:",
    error: {
      name: error.name,
      type: error.name,
      message: error.message,
      stack_trace: error.stack,
    },
  });

  expect(output).toContain("    at ");
});

it("omits the stack trace for unexpected errors when stack traces are disabled", () => {
  const error = new TypeError("Cannot read properties of undefined");

  expect.assert(error.stack);

  const output = render(
    {
      message: "download-item failed:",
      error: {
        name: error.name,
        type: error.name,
        message: error.message,
        stack_trace: error.stack,
      },
    },
    false,
  );

  expect(output).toContain(
    "download-item failed: Cannot read properties of undefined",
  );

  expect(output).not.toContain("    at ");
});
