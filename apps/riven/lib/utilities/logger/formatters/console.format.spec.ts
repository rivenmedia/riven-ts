import { UnrecoverableError } from "bullmq";
import { DateTime } from "luxon";
import { stripVTControlCharacters } from "node:util";
import { SPLAT } from "triple-beam";
import { expect, it } from "vitest";
import z from "zod";

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

it("renders the timestamp, log tags and level before the message", () => {
  const output = stripVTControlCharacters(
    render({
      level: "info",
      "log.level": "info",
      message: "Mounted VFS",
      "riven.log.source": "vfs",
      "riven.plugin.name": "@repo/plugin-tmdb",
      "riven.worker.id": "worker-1",
    }),
  );

  const timestamp = DateTime.fromISO("2026-07-23T23:44:01.000Z").toFormat(
    "yyyy-LL-dd TT",
  );

  expect(output).toBe(
    `${timestamp} - vfs - @repo/plugin-tmdb - worker-1 - info: Mounted VFS`,
  );
});

it("renders only the message when no error is logged", () => {
  const output = stripVTControlCharacters(
    render({ level: "info", "log.level": "info", message: "All good" }),
  );

  expect(output).toMatch(/ - info: All good$/u);
});

function createValidationError() {
  const { error } = z.object({ title: z.string() }).safeParse({ title: 1 });

  expect.assert(error);

  return error;
}

it("prettifies validation errors when stack traces are disabled", () => {
  const validationError = createValidationError();

  const output = stripVTControlCharacters(
    render(
      { message: "Invalid item:", [SPLAT]: [{ err: validationError }] },
      false,
    ),
  );

  expect(output).toMatch(
    new RegExp(
      `- error: Invalid item: ${RegExp.escape(z.prettifyError(validationError))}$`,
      "u",
    ),
  );
});

it("shows the stack trace of validation errors when stack traces are enabled", () => {
  const validationError = createValidationError();

  const output = render({
    message: "Invalid item:",
    [SPLAT]: [validationError],
  });

  expect.assert(validationError.stack);

  expect(output).toContain(validationError.stack);
});

it("uses the validation error message when the log message is not a string", () => {
  const validationError = createValidationError();

  const output = stripVTControlCharacters(
    render(
      {
        message: { unexpected: true },
        [SPLAT]: [validationError],
      },
      false,
    ),
  );

  expect(output).toContain(
    `- error: ${validationError.message} ${z.prettifyError(validationError)}`,
  );
});
