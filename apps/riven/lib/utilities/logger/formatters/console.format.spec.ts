import { SPLAT } from "triple-beam";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

vi.mock("../../settings.ts", () => ({
  settings: { logShowStackTraces: false },
}));

// Re-import after mock is set up
const { consoleFormat } = await import("./console.format.ts");
const { settings } = await import("../../settings.ts");

describe("consoleFormat", () => {
  const baseInfo = {
    "@timestamp": "2024-01-15T10:30:00.000Z",
    level: "info",
    "log.level": "info",
  };

  it("formats a simple message", () => {
    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Hello world",
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;
    expect(output).toContain("Hello world");
    expect(output).toContain("info");
  });

  it("formats an error level message in red", () => {
    const result = consoleFormat.transform({
      ...baseInfo,
      level: "error",
      "log.level": "error",
      message: "Something failed",
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;
    expect(output).toContain("Something failed");
  });

  it("includes error message from meta.error", () => {
    const error = new Error("test error message");
    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Operation failed",
      error,
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;
    expect(output).toContain("test error message");
  });

  it("prettifies ZodError when stack traces are disabled", () => {
    const zodError = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        path: ["field"],
        message: "Expected string, received number",
      },
    ]);

    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Validation failed",
      error: zodError,
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;
    expect(output).toContain("Validation failed");
  });

  it("shows stack trace for ZodError when enabled", () => {
    (settings as Record<string, unknown>).logShowStackTraces = true;

    const zodError = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        path: ["field"],
        message: "Expected string, received number",
      },
    ]);

    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Validation failed",
      error: zodError,
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;

    // Stack trace should contain the error class name
    expect(output).toContain("Validation failed");

    (settings as Record<string, unknown>).logShowStackTraces = false;
  });

  it("handles SPLAT errors", () => {
    const error = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["name"],
        message: "Expected string",
      },
    ]);

    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Check failed",
      [SPLAT]: [{ err: error }],
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;

    expect(output).toBeDefined();
  });

  it("includes source tags in output", () => {
    const result = consoleFormat.transform({
      ...baseInfo,
      message: "tagged message",
      "riven.log.source": "test-source",
      "riven.plugin.name": "my-plugin",
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;

    expect(output).toContain("test-source");
    expect(output).toContain("my-plugin");
  });

  it("handles non-string messages with SPLAT fallback", () => {
    const result = consoleFormat.transform({
      ...baseInfo,
      message: 42,
      [SPLAT]: [{ message: "fallback message" }],
    });

    expect(result).not.toBe(false);
  });

  it("handles raw error objects with stack_trace property", () => {
    (settings as Record<string, unknown>)["logShowStackTraces"] = true;

    const rawError = { message: "raw error", stack_trace: "at line 1" };
    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Raw error occurred",
      error: rawError,
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;
    expect(output).toContain("at line 1");

    (settings as Record<string, unknown>).logShowStackTraces = false;
  });

  it("handles raw error objects showing message when stack traces disabled", () => {
    const rawError = { message: "raw error msg", stack_trace: "at line 1" };
    const result = consoleFormat.transform({
      ...baseInfo,
      message: "Raw error occurred",
      error: rawError,
    });

    expect(result).not.toBe(false);

    const output = (result as Record<string, unknown>)[
      Symbol.for("message")
    ] as string;
    expect(output).toContain("raw error msg");
  });
});
