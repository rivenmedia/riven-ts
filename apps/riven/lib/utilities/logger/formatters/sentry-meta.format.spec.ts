import { expect, it } from "vitest";

import { withLogContext } from "../log-context.ts";
import { sentryMetaFormat } from "./sentry-meta.format.ts";

import type { SessionID } from "../session-id.ts";
import type { TransformableInfo } from "logform";

it("does not throw without an active log context", () => {
  const result = sentryMetaFormat().transform({
    message: "startup log",
  } as TransformableInfo);

  expect(result).toMatchObject({
    message: "startup log",
  });
});

it("adds active log context metadata", () => {
  const sessionId = "00000000-0000-4000-8000-000000000000" as SessionID;

  withLogContext(
    {
      "riven.log.source": "test",
      "riven.session.id": sessionId,
    },
    () => {
      const result = sentryMetaFormat().transform({
        message: "contextual log",
      } as TransformableInfo);

      expect(result).toMatchObject({
        message: "contextual log",
        "riven.log.source": "test",
        "riven.session.id": sessionId,
      });
    },
  );
});
