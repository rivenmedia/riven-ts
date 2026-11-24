import { ws } from "msw/ws";
import { WebSocket } from "ws";

import type { AnyHandler } from "msw";
import type { WebSocketData } from "msw/ws";

/**
 * "Terminated", which graphql-ws retries with a backoff.
 * On a 1000 close it reconnects at once, with no backoff, whilst subscriptions are active, which loops.
 */
const TERMINATED_CLOSE_CODE = 4499;

/**
 * Whether a close code can be sent in a close frame: 1000 to 1003, 1007 to 1014 and 3000 to 4999.
 * The others, such as 1005 (no code) and 1006 (dropped), only describe how a connection ended, and sending them throws.
 */
const isSendableCloseCode = (code: number) =>
  (code >= 1000 && code <= 1003) ||
  (code >= 1007 && code <= 1014) ||
  (code >= 3000 && code <= 4999);

/**
 * Bridges the browser's GraphQL WebSocket, which it opens to the frontend's `/graphql`, to the worker's Riven,
 * forwarding the frames in both directions.
 *
 * Playwright's `connectToServer()` can only reach the URL the browser opened, so the bridge opens its own socket.
 */
export function createWebSocketBridge(
  rivenUrl: URL,
  getCookieHeader: () => Promise<string>,
): AnyHandler {
  // Relative to the page's origin, which is the frontend's
  return ws
    .link("/graphql")
    .addEventListener("connection", ({ client, info }) => {
      // The browser's socket is open as soon as it's routed, so it sends frames (e.g. `connection_init`) before Riven's is
      const pendingFrames: WebSocketData[] = [];
      let upstream: WebSocket | undefined = undefined;
      let isClientClosed = false;

      client.addEventListener("message", ({ data }) => {
        if (upstream?.readyState === WebSocket.OPEN) {
          upstream.send(data);
        } else if (!upstream || upstream.readyState === WebSocket.CONNECTING) {
          pendingFrames.push(data);
        }
      });

      client.addEventListener("close", ({ code, reason }) => {
        isClientClosed = true;
        pendingFrames.length = 0;

        // Without an upstream yet, `connect` sees the client has closed and never opens one
        if (!upstream) {
          return;
        }

        if (isSendableCloseCode(code)) {
          upstream.close(code, reason);
        } else {
          upstream.close();
        }
      });

      const connect = (cookieHeader: string) => {
        if (isClientClosed) {
          return;
        }

        // Riven authenticates a subscription by the cookies on its upgrade request, as the browser would send them
        const socket = new WebSocket(
          `ws://${rivenUrl.host}/graphql`,
          info.protocols,
          cookieHeader ? { headers: { cookie: cookieHeader } } : {},
        );

        upstream = socket;

        socket.on("open", () => {
          for (const frame of pendingFrames) {
            socket.send(frame);
          }

          pendingFrames.length = 0;
        });

        socket.on("message", (data, isBinary) => {
          // Riven may still send frames whilst the close the client started reaches it
          if (isClientClosed) {
            return;
          }

          const frame = Array.isArray(data) ? Buffer.concat(data) : data;

          client.send(
            isBinary ? new Uint8Array(frame) : new TextDecoder().decode(frame),
          );
        });

        socket.on("error", () => {
          // A `close` always follows, which closes the client
        });

        socket.on("close", (code, reason) => {
          if (isClientClosed) {
            return;
          }

          if (isSendableCloseCode(code)) {
            client.close(code, reason.toString());
          } else {
            client.close(TERMINATED_CLOSE_CODE, "Upstream terminated");
          }
        });
      };

      // Read for each connection, as the browser's cookies change when it signs in or out mid-test
      getCookieHeader()
        .then(connect)
        .catch(() => {
          // E.g. the browser context closed before its cookies were read
          if (!isClientClosed) {
            client.close(TERMINATED_CLOSE_CODE, "Cookies unavailable");
          }
        });
    });
}
