// @vitest-environment node
import { WebSocketInterceptor } from "@mswjs/interceptors/WebSocket";
import { defineNetwork, InterceptorSource } from "msw/experimental";
import { once } from "node:events";
import { IncomingMessage } from "node:http";
import { it as baseIt, expect, onTestFinished } from "vitest";
import { WebSocket as UpstreamSocket, WebSocketServer } from "ws";

import { createWebSocketBridge } from "./websocket-bridge.ts";

import type { AddressInfo } from "node:net";
import type { RawData } from "ws";

/** The frontend's origin, which the browser opens its subscriptions to */
const frontendOrigin = "http://frontend.test";

interface UpstreamConnection {
  socket: UpstreamSocket;
  request: IncomingMessage;
  messages: string[];
}

const toText = (data: RawData) =>
  Array.isArray(data)
    ? Buffer.concat(data).toString()
    : new TextDecoder().decode(data);

interface Upstream {
  /** Resolves with the next connection the upstream accepts, so must be called before it connects */
  nextConnection: () => Promise<UpstreamConnection>;
}

const it = baseIt.extend<{
  /** A WebSocket server that stands in for Riven, and answers each message with a reply that names it */
  upstream: Upstream;
  /** Opens a WebSocket to the frontend's `/graphql`, as the browser does for its subscriptions */
  openClient: () => WebSocket;
}>({
  upstream: async ({}, use) => {
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

    const { port } = server.address() as AddressInfo;

    const network = defineNetwork({
      sources: [
        new InterceptorSource({ interceptors: [new WebSocketInterceptor()] }),
      ],
      handlers: [
        createWebSocketBridge(new URL(`http://127.0.0.1:${String(port)}`)),
      ],
      context: { baseUrl: frontendOrigin, quiet: true },
      onUnhandledFrame: "error",
    });

    network.enable();

    await use({
      nextConnection: async () => {
        const [socket, request] = await once(server, "connection");

        expect.assert(socket instanceof UpstreamSocket);
        expect.assert(request instanceof IncomingMessage);

        const messages = messagesBySocket.get(socket);

        expect.assert(messages);

        return { socket, request, messages };
      },
    });

    network.disable();

    for (const client of server.clients) {
      client.terminate();
    }

    server.close();
  },
  openClient: async ({ upstream: _ }, use) => {
    await use(() => {
      const client = new WebSocket(
        new URL("/graphql", frontendOrigin.replace(/^http/u, "ws")),
        "graphql-transport-ws",
      );

      onTestFinished(() => {
        client.close();
      });

      return client;
    });
  },
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
