import { once } from "node:events";
import { createServer } from "node:http";
import { getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { expect, it as baseIt } from "vitest";

import { installLoopbackOnlyDispatcher } from "./loopback-only-dispatcher.ts";

const it = baseIt.extend("installDispatcher", ({}, { onCleanup }) => {
  const originalDispatcher = getGlobalDispatcher();

  onCleanup(() => {
    setGlobalDispatcher(originalDispatcher);
  });

  return installLoopbackOnlyDispatcher;
});

it("rejects a request to an external host", async ({ installDispatcher }) => {
  installDispatcher();

  // fetch wraps the dispatcher's error as the cause of a generic TypeError
  await expect(fetch("https://example.com")).rejects.toHaveProperty(
    "cause.message",
    expect.stringMatching(/loopback/u),
  );
});

it("allows a request to a loopback server", async ({ installDispatcher }) => {
  installDispatcher();

  const server = createServer((_request, response) => {
    response.end("hello from loopback");
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();

    expect.assert(address && typeof address === "object");

    const response = await fetch(`http://127.0.0.1:${address.port.toString()}`);

    await expect(response.text()).resolves.toBe("hello from loopback");
  } finally {
    server.close();
  }
});
