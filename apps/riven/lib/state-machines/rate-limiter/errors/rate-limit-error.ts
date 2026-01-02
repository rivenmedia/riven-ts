import type { RateLimiter } from "limiter";
import { DateTime } from "luxon";

/**
 * Error thrown when a request is rate limited by the server.
 *
 * @class RateLimitError
 * @extends {Error}
 *
 * @property {string} url - The URL that was rate limited.
 * @property {string | null} retryAfterHeader - The value of the "Retry-After" header from the response.
 */
export class RateLimitError extends Error {
  /**
   * The URL that was rate limited.
   */
  url: string;

  /**
   * The number of milliseconds to wait before retrying the request.
   */
  retryAfter: number;

  /**
   * Parses the Retry-After header value and returns the delay in milliseconds.
   *
   * @param retryAfterHeader - The value of the Retry-After header, which can be either:
   *   - An HTTP date string (RFC 7231 format)
   *   - A number representing seconds to wait
   *   - `null` if the header is not present
   *
   * @returns The delay in milliseconds before the next request should be attempted.
   *   Calculates an estimated value from the token bucket if the header is null.
   *
   * @throws {Error} If the Retry-After header value cannot be parsed as either a valid
   *   HTTP date or a numeric value (seconds).
   */
  private parseRetryAfterHeader(
    limiter: RateLimiter | null,
    retryAfterHeader: string | number | null,
  ): number {
    if (retryAfterHeader === null) {
      if (!limiter) {
        throw new Error(
          `No Retry-After header present and no limiter available to estimate delay for ${this.url}`,
        );
      }

      return Math.ceil(
        (1 - limiter.tokenBucket.content) *
          (limiter.tokenBucket.interval /
            limiter.tokenBucket.tokensPerInterval),
      );
    }

    if (typeof retryAfterHeader === "number") {
      return retryAfterHeader;
    }

    const httpDate = DateTime.fromHTTP(retryAfterHeader);

    if (httpDate.isValid) {
      return httpDate.diffNow().milliseconds;
    }

    const retryAfterSeconds = parseInt(retryAfterHeader, 10);

    if (isNaN(retryAfterSeconds)) {
      throw new Error(
        `Unable to parse Retry-After header value: ${retryAfterHeader} from ${this.url}`,
      );
    }

    // If the Retry-After header is a number, it's the number of seconds to wait
    return retryAfterSeconds * 1000;
  }

  constructor(
    limiter: RateLimiter | null,
    url: string,
    retryAfterHeader: string | null,
  ) {
    super();

    this.url = url;
    this.retryAfter = this.parseRetryAfterHeader(limiter, retryAfterHeader);
  }
}
