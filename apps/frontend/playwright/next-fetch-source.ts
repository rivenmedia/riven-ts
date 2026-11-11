import { HttpResponse } from "msw";
import { HttpNetworkFrame, NetworkSource } from "msw/experimental";

import type {
  FetchHandlerResult,
  NextFixture,
} from "next/experimental/testmode/playwright.js";

/**
 * Settles a fetch made by the Next.js server with the outcome of MSW's handlers.
 *
 * Unhandled requests settle as `undefined`, which Next.js aborts, so a test fails rather than reaching a real backend.
 */
class NextFetchFrame extends HttpNetworkFrame {
  readonly #settle: (result: FetchHandlerResult) => void;

  #isUnhandled = false;

  public constructor(
    request: Request,
    settle: (result: FetchHandlerResult) => void,
  ) {
    super({ request });

    this.#settle = settle;

    this.events.on("request:unhandled", () => {
      this.#isUnhandled = true;
    });
  }

  public override respondWith(response?: Response) {
    if (response) {
      this.#settle(response.status === 0 ? "abort" : response);
    }
  }

  public override passthrough() {
    this.#settle(this.#isUnhandled ? undefined : "continue");
  }

  public override errorWith(reason?: unknown) {
    if (reason instanceof Response) {
      this.respondWith(reason);

      return;
    }

    const error = reason instanceof Error ? reason : new Error(String(reason));

    this.respondWith(
      HttpResponse.json(
        { name: error.name, message: error.message, stack: error.stack },
        { status: 500, statusText: "Request Handler Error" },
      ),
    );
  }
}

export const isNextFetchFrame = (frame: unknown) =>
  frame instanceof NextFetchFrame;

/**
 * An MSW network source for the fetches made by the Next.js server, which Next.js' test mode sends to Playwright.
 *
 * The page's own requests are handled by `@msw/playwright`, whose routes take precedence over Next.js'.
 */
export class NextFetchSource extends NetworkSource<NextFetchFrame> {
  #enabled = false;

  #inFlight = 0;

  #lastActivity = 0;

  public constructor(next: NextFixture) {
    super();

    next.onFetch(async (request) => {
      if (!this.#enabled) {
        return undefined;
      }

      this.#inFlight += 1;
      this.#lastActivity = performance.now();

      const { promise, resolve } = Promise.withResolvers<FetchHandlerResult>();

      void promise.finally(() => {
        this.#inFlight -= 1;
        this.#lastActivity = performance.now();
      });
      const frame = new NextFetchFrame(request, resolve);

      await this.queue(frame);

      // Settle requests that are still in-flight when the network is disabled
      frame.passthrough();

      return promise;
    });
  }

  /**
   * Waits for the Next.js server to stop fetching, e.g. after a test's pages close, as it can keep rendering for them
   * (e.g. prefetched routes). Fetches that arrive once the test has ended are aborted, which Next.js logs as errors.
   */
  public async waitForIdle({ idleMs = 250, timeoutMs = 2000 } = {}) {
    const deadline = performance.now() + timeoutMs;

    while (performance.now() < deadline) {
      if (
        this.#inFlight === 0 &&
        performance.now() - this.#lastActivity >= idleMs
      ) {
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    }
  }

  public enable() {
    this.#enabled = true;
  }

  public override disable() {
    this.#enabled = false;

    return super.disable();
  }
}
