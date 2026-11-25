// @vitest-environment node
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { it as baseIt, expect } from "vitest";

import { waitUntilReady } from "./wait-until-ready.ts";

import type { AddressInfo } from "node:net";

const it = baseIt.extend("healthyServerUrl", async ({}, { onCleanup }) => {
  const server = createServer((_request, response) => {
    response.end("OK");
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const { port } = server.address() as AddressInfo;

  onCleanup(() => {
    server.close();
  });

  return new URL(`http://127.0.0.1:${String(port)}`);
});

it("is ready when the server answers whilst the process runs", async ({
  healthyServerUrl,
}) => {
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 10_000)"]);

  try {
    await expect(
      waitUntilReady({ url: healthyServerUrl, child, timeoutMs: 5000 }),
    ).resolves.toBe(true);
  } finally {
    child.kill();
  }
});

it("isn't ready when another process answers after this one exited", async ({
  healthyServerUrl,
}) => {
  const child = spawn(process.execPath, ["-e", ""]);

  await once(child, "exit");

  await expect(
    waitUntilReady({ url: healthyServerUrl, child, timeoutMs: 5000 }),
  ).resolves.toBe(false);
});
