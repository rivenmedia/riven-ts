import { Agent, setGlobalDispatcher } from "undici";

// URL hostnames keep the brackets around IPv6 addresses
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Sandboxed jobs run in separate processes where MSW isn't installed, so
 * nothing stops them reaching real services in test mode. Make the global
 * `fetch` refuse anything but loopback, which Riven's own GraphQL API uses.
 *
 * Raw `net`/`http` clients bypass the undici dispatcher and are not covered.
 */
export const installLoopbackOnlyDispatcher = () => {
  setGlobalDispatcher(
    new Agent().compose((dispatch) => (options, handler) => {
      const hostname = options.origin
        ? new URL(options.origin).hostname
        : undefined;

      if (!hostname || !loopbackHosts.has(hostname)) {
        throw new Error(
          `Sandboxed job requested non-loopback origin ${String(options.origin)}; only loopback requests are allowed in test mode`,
        );
      }

      return dispatch(options, handler);
    }),
  );
};
