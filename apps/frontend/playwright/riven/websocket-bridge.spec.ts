// @vitest-environment node
import { WebSocketInterceptor } from "@mswjs/interceptors/WebSocket";
import { defineNetwork, InterceptorSource } from "msw/experimental";
import { once } from "node:events";
import { IncomingMessage } from "node:http";
import { it as baseIt, expect, onTestFinished, vi } from "vitest";
import { WebSocketServer, WebSocket as UpstreamSocket } from "ws";

import { createWebSocketBridge } from "./websocket-bridge.ts";

import type { RawData } from "ws";

/** The frontend's origin, which the browser opens its subscriptions to */
const frontendOrigin = "http://frontend.test";

const toText = (data: RawData) =>
  Array.isArray(data)
    ? Buffer.concat(data).toString()
    : new TextDecoder().decode(data);

const it = baseIt
  .extend("getCookieHeader", ({}) =>
    vi.fn<() => Promise<string>>().mockResolvedValue(""),
  )
  .extend("upstream", async ({ getCookieHeader }, { onCleanup }) => {
    const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });

    await once(server, "listening");

    const messagesBySocket = new WeakMap<UpstreamSocket, string[]>();

    server.on("connection", (socket) => {
      const messages: string[] = [];

      messagesBySocket.set(socket, messages);

      socket.on("message", (data) => {
        const message = toText(data);

        messages.push(message);
        socket.send(`reply to ${message}`);
      });
    });

    const address = server.address();

    expect.assert(address && typeof address === "object");

    const { port } = address;

    const network = defineNetwork({
      sources: [
        new InterceptorSource({ interceptors: [new WebSocketInterceptor()] }),
      ],
      handlers: [
        createWebSocketBridge(
          new URL(`http://127.0.0.1:${String(port)}`),
          getCookieHeader,
        ),
      ],
      context: { baseUrl: frontendOrigin, quiet: true },
      onUnhandledFrame: "error",
    });

    network.enable();

    onCleanup(() => {
      network.disable();

      for (const client of server.clients) {
        client.terminate();
      }

      server.close();
    });

    return {
      nextConnection: async () => {
        const [socket, request] = await once(server, "connection");

        expect.assert(socket instanceof UpstreamSocket);
        expect.assert(request instanceof IncomingMessage);

        const messages = messagesBySocket.get(socket);

        expect.assert(messages);

        return { socket, request, messages };
      },
    };
  })
  .extend("openClient", ({ upstream: _ }) => () => {
    const client = new WebSocket(
      new URL("/graphql", frontendOrigin.replace(/^http/u, "ws")),
      "graphql-transport-ws",
    );

    onTestFinished(() => {
      client.close();
    });

    return client;
  });

it("forwards client frames to the upstream and upstream frames back", async ({
  upstream,
  openClient,
}) => {
  const client = openClient();
  const reply = new Promise<unknown>((resolve) => {
    client.addEventListener("message", ({ data }) => {
      resolve(data);
    });
  });

  // Sent as soon as the client opens, which is before the upstream has
  client.addEventListener("open", () => {
    client.send('{"type":"connection_init"}');
  });

  const connection = await upstream.nextConnection();

  await expect(reply).resolves.toBe('reply to {"type":"connection_init"}');

  expect(connection.request.url).toBe("/graphql");
  expect(connection.socket.protocol).toBe("graphql-transport-ws");
  expect(connection.messages).toStrictEqual(['{"type":"connection_init"}']);
});

it("closes the upstream socket when the client closes", async ({
  upstream,
  openClient,
}) => {
  const client = openClient();
  const { socket } = await upstream.nextConnection();
  const upstreamClosed = once(socket, "close");

  client.close();

  await expect(upstreamClosed).resolves.toBeDefined();
});

it("closes the client when the upstream closes", async ({
  upstream,
  openClient,
}) => {
  const client = openClient();
  const clientClosed = once(client, "close");
  const { socket } = await upstream.nextConnection();

  socket.close(4400, "Invalid message");

  await expect(clientClosed).resolves.toMatchObject([
    { code: 4400, reason: "Invalid message" },
  ]);
});

it("forwards a close code of 1001 to the client", async ({
  upstream,
  openClient,
}) => {
  const client = openClient();
  const clientClosed = once(client, "close");
  const { socket } = await upstream.nextConnection();

  socket.close(1001, "Going away");

  await expect(clientClosed).resolves.toMatchObject([{ code: 1001 }]);
});

it("closes the client with 4499 when the upstream drops without a close code", async ({
  upstream,
  openClient,
}) => {
  const client = openClient();
  const clientClosed = once(client, "close");
  const { socket } = await upstream.nextConnection();

  // The upstream sees 1006, which can't be sent. A 1000 would make graphql-ws reconnect at once, with no backoff.
  socket.terminate();

  await expect(clientClosed).resolves.toMatchObject([{ code: 4499 }]);
});

it("closes the client with 4499 when the browser's cookies can't be read", async ({
  getCookieHeader,
  openClient,
}) => {
  getCookieHeader.mockRejectedValueOnce(new Error("Context closed"));

  const clientClosed = once(openClient(), "close");

  await expect(clientClosed).resolves.toMatchObject([{ code: 4499 }]);
});

it("sends the cookies the browser has as each client connects to the upstream", async ({
  getCookieHeader,
  upstream,
  openClient,
}) => {
  getCookieHeader.mockResolvedValueOnce("session=signed-out");
  openClient();

  const signedOut = await upstream.nextConnection();

  getCookieHeader.mockResolvedValueOnce("session=signed-in");
  openClient();

  const signedIn = await upstream.nextConnection();

  expect(signedOut.request.headers.cookie).toBe("session=signed-out");
  expect(signedIn.request.headers.cookie).toBe("session=signed-in");
});
