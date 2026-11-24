import { ClientRequestInterceptor } from "@mswjs/interceptors/ClientRequest";
import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import { HttpRequestInterceptor } from "@mswjs/interceptors/http";
import { WebSocketInterceptor } from "@mswjs/interceptors/WebSocket";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";
import {
  HttpNetworkFrame,
  InterceptorSource,
  defineNetwork,
} from "msw/experimental";
import z from "zod";

import { mockScenarioNames } from "./e2e/scenario-names.ts";
import { scenarios } from "./scenarios/index.ts";
import { isMockTestMode } from "./utilities/is-mock-test-mode.ts";
import { unhandledRequests } from "./utilities/unhandled-requests.ts";

import type { MockScenario } from "./utilities/mock-scenario.ts";

const mockScenarioName = z
  .enum(mockScenarioNames)
  .safeParse(process.env["MOCK_SCENARIO"]);

if (!mockScenarioName.success) {
  throw new Error(
    `Invalid mock scenario: ${z.prettifyError(mockScenarioName.error)}`,
  );
}

if (
  process.env["NODE_ENV"] !== "development" &&
  process.env["NODE_ENV"] !== "test"
) {
  throw new Error(
    "Mock scenarios should only be enabled in development or test environments.",
  );
}

export const mockScenario: MockScenario = scenarios[mockScenarioName.data];

if (isMockTestMode() && mockScenario.environmentData) {
  throw new Error(
    "Mock scenarios can't set environment data in test mode, as every E2E instance boots with the same environment.",
  );
}

// URL hostnames keep the brackets around IPv6 addresses
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

const network = defineNetwork({
  sources: [
    new InterceptorSource({
      interceptors: [
        // `setupServer`'s default interceptors
        new ClientRequestInterceptor(),
        new XMLHttpRequestInterceptor(),
        new FetchInterceptor(),
        new WebSocketInterceptor(),
        // Intercepts every HTTP request, including the VFS's `undici.request` calls
        new HttpRequestInterceptor(),
      ],
    }),
  ],
  handlers: [...(mockScenario.handlers ?? [])],
  context: { quiet: true },
  onUnhandledFrame: isMockTestMode()
    ? ({ frame, defaults }) => {
        if (frame instanceof HttpNetworkFrame) {
          const { request } = frame.data;

          // Riven calls itself over loopback, e.g. with its own Apollo client
          if (loopbackHosts.has(new URL(request.url).hostname)) {
            return;
          }

          unhandledRequests.record({
            method: request.method,
            url: request.url,
          });

          defaults.error();

          // `defaults.error()` only logs, so fail the request before it reaches the network
          frame.respondWith(Response.error());

          return;
        }

        defaults.error();
        frame.errorWith(
          new Error("Riven test mode refused an unhandled connection"),
        );
      }
    : "bypass",
});

network.enable();

export const server = {
  use: network.use.bind(network),
  resetHandlers: network.resetHandlers.bind(network),
  close: () => {
    network.disable();
  },
};
