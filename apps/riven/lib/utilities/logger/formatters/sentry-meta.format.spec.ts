import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  getActiveSpan: vi.fn(),
}));

vi.mock("../log-context.ts", () => ({
  getLogContext: vi.fn(),
}));

const Sentry = await import("@sentry/node");
const { getLogContext } = await import("../log-context.ts");
const { sentryMetaFormat } = await import("./sentry-meta.format.ts");

describe("sentryMetaFormat", () => {
  it("adds trace and span IDs when an active span exists", () => {
    vi.mocked(Sentry.getActiveSpan).mockReturnValue({
      spanContext: () => ({
        spanId: "span-123",
        traceId: "trace-456",
        traceFlags: 0,
      }),
    } as ReturnType<typeof Sentry.getActiveSpan>);

    vi.mocked(getLogContext).mockReturnValue({
      "riven.log.source": "test",
    });

    const info = { level: "info", message: "test" };
    const result = sentryMetaFormat().transform(info);

    expect(result).toMatchObject({
      "trace.id": "trace-456",
      "span.id": "span-123",
      "riven.log.source": "test",
    });
  });

  it("skips trace info when no active span", () => {
    vi.mocked(Sentry.getActiveSpan).mockReturnValue(undefined);
    vi.mocked(getLogContext).mockReturnValue({
      "riven.log.source": "test",
    });

    const info = { level: "info", message: "test" };
    const result = sentryMetaFormat().transform(info);

    expect(result).not.toHaveProperty("trace.id");
    expect(result).not.toHaveProperty("span.id");
    expect(result).toMatchObject({
      "riven.log.source": "test",
    });
  });

  it("merges log context into info", () => {
    vi.mocked(Sentry.getActiveSpan).mockReturnValue(undefined);
    vi.mocked(getLogContext).mockReturnValue({
      "riven.log.source": "my-source",
      "riven.plugin.name": "my-plugin",
    });

    const info = { level: "debug", message: "hello" };
    const result = sentryMetaFormat().transform(info);

    expect(result).toMatchObject({
      level: "debug",
      message: "hello",
      "riven.log.source": "my-source",
      "riven.plugin.name": "my-plugin",
    });
  });
});
