import z from "zod";

const { data: spotlightEnabled } = z
  .stringbool()
  .safeParse(process.env["SENTRY_SPOTLIGHT"] ?? "0");

if (spotlightEnabled) {
  const Sentry = await import("@sentry/node");

  Sentry.init({
    dsn: "https://spotlight@local/0",
    sampleRate: 1,
    tracesSampleRate: 1,
    beforeSendTransaction(event) {
      if (
        ["extendLocks", "moveStalledJobsToWait"].includes(
          String(event.contexts?.trace?.data?.["bullmq.queue.operation"]),
        )
      ) {
        return null;
      }

      for (const span of event.spans ?? []) {
        if (span.data["sentry.parent_span_already_sent"]) {
          console.log(
            "Not sending transaction because parent span was already sent",
          );
          console.log(event);
          return null;
        }

        if (span.data["bullmq.queue.operation"] === "fail") {
          span.status = "error";

          if (event.contexts?.trace) {
            event.contexts.trace.status = "error";
          }

          break;
        }
      }

      return event;
    },
  });
}
