import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import z from "zod";

const jaegerUrl = z.url().parse(process.env["JAEGER_URL"]);

const sdk = new NodeSDK({
  serviceName: "consumer",
  traceExporter: new OTLPTraceExporter({
    url: `${jaegerUrl}/v1/traces`,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${jaegerUrl}/v1/metrics`,
    }),
  }),
});

sdk.start();
