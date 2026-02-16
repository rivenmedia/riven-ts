import { BullMQOtel } from "bullmq-otel";

export const telemetry = new BullMQOtel({
  tracerName: "riven",
  meterName: "riven",
  enableMetrics: true,
});
