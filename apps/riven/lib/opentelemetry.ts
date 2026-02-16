import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { logger } from "./utilities/logger/logger.ts";
import { settings } from "./utilities/settings.ts";

if (!settings.jaegerUrl) {
  logger.info(
    "Jaeger URL not configured. Skipping OpenTelemetry initialisation.",
  );
} else {
  // const sdk = new NodeSDK({
  //   serviceName: "consumer",
  //   traceExporter: new OTLPTraceExporter({
  //     url: `${settings.jaegerUrl}/v1/traces`,
  //   }),
  //   metricReader: new PeriodicExportingMetricReader({
  //     exporter: new OTLPMetricExporter({
  //       url: `${settings.jaegerUrl}/v1/metrics`,
  //     }),
  //   }),
  // });
  // sdk.start();
}
