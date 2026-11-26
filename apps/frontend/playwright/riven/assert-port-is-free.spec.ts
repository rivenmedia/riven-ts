// @vitest-environment node
import { createServer } from "node:net";
import { expect, it } from "vitest";

import { assertPortIsFree } from "./assert-port-is-free.ts";

import type { AddressInfo } from "node:net";

const listen = async () => {
  const server = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  return {
    port: (server.address() as AddressInfo).port,
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
      }),
  };
};

it("fails with the port when something is listening on it", async () => {
  const { port, close } = await listen();

  try {
    await expect(assertPortIsFree(port)).rejects.toThrow(
      `Port ${String(port)} is already in use`,
    );
  } finally {
    await close();
  }
});

it("passes when nothing is listening on the port", async () => {
  const { port, close } = await listen();

  await close();

  await expect(assertPortIsFree(port)).resolves.toBeUndefined();
});
