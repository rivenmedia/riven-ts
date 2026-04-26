import * as Sentry from "@sentry/node";
import { AsyncLocalStorage } from "node:async_hooks";
import { getEnvironmentData } from "node:worker_threads";
import z from "zod";

export const SessionID = z.uuidv4().brand<"SessionID">();

export type SessionID = z.infer<typeof SessionID>;

export interface LogContext {
  "riven.log.source"?: string;
  "riven.session.id"?: SessionID;
  "riven.flow.name"?: string;
  "riven.event.name"?: string;
  "riven.plugin.name"?: string;
  "riven.worker.id"?: string;
  "riven.sandboxed-job.name"?: string;
  "bullmq.queue.name"?: string;
  "bullmq.job.id"?: string;
}

export const logContext = new AsyncLocalStorage<LogContext>();

export function withLogContext<T>(
  context: LogContext,
  callback: (scope: Sentry.Scope) => T,
): T {
  context["riven.session.id"] ??= SessionID.parse(
    getEnvironmentData("riven.session.id"),
  );

  return Sentry.withScope((scope) => {
    scope.setTags({
      ...context,
    });

    return logContext.run(context, callback.bind(null, scope));
  });
}

export function getLogContext(): LogContext {
  const context = logContext.getStore();

  if (!context) {
    throw new Error("No log context available");
  }

  return context;
}
