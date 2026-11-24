import { ws } from "msw/ws";
import { WebSocket } from "ws";

import type { AnyHandler } from "msw";
import type { WebSocketData } from "msw/ws";

/**
 * Whether a close code can be sent in a close frame.
 * The others, such as 1005 (no code) and 1006 (dropped), only describe how a connection ended, and sending them throws.
 */
const isSendableCloseCode = (code: number) =>
  code === 1000 || (code >= 3000 && code <= 4999);

/**
 * Bridges the browser's GraphQL WebSocket, which it opens to the frontend's `/graphql`, to the worker's Riven,
 * forwarding the frames in both directions.
 *
 * Playwright's `connectToServer()` can only reach the URL the browser opened, so the bridge opens its own socket.
 */
export function createWebSocketBridge(rivenUrl: URL): AnyHandler {
  // Relative to the page's origin, which is the frontend's
  return ws
    .link("/graphql")
    .addEventListener("connection", ({ client, info }) => {
      const upstream = new WebSocket(
        `ws://${rivenUrl.host}/graphql`,
        info.protocols,
      );

      // The browser's socket is open as soon as it's routed, so it sends frames (e.g. `connection_init`) before Riven's is
      const pendingFrames: WebSocketData[] = [];
      let isClientClosed = false;

      client.addEventListener("message", ({ data }) => {
        if (upstream.readyState === WebSocket.CONNECTING) {
          pendingFrames.push(data);
        } else if (upstream.readyState === WebSocket.OPEN) {
          upstream.send(data);
        }
      });

      client.addEventListener("close", ({ code, reason }) => {
        isClientClosed = true;
        pendingFrames.length = 0;

        if (isSendableCloseCode(code)) {
          upstream.close(code, reason);
        } else {
          upstream.close();
        }
      });

      upstream.on("open", () => {
        for (const frame of pendingFrames) {
          upstream.send(frame);
        }

        pendingFrames.length = 0;
      });

      upstream.on("message", (data, isBinary) => {
        // Riven may still send frames whilst the close the client started reaches it
        if (isClientClosed) {
          return;
        }

        const frame = Array.isArray(data) ? Buffer.concat(data) : data;

        client.send(
          isBinary ? new Uint8Array(frame) : new TextDecoder().decode(frame),
        );
      });

      upstream.on("error", () => {
        // A `close` always follows, which closes the client
      });

      upstream.on("close", (code, reason) => {
        if (isClientClosed) {
          return;
        }

        if (isSendableCloseCode(code)) {
          client.close(code, reason.toString());
        } else {
          client.close();
        }
      });
    });
}
