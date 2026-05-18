import { StatusCodes } from "http-status-codes";
import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it.for([
  [StatusCodes.INTERNAL_SERVER_ERROR, false],
  [StatusCodes.BAD_GATEWAY, false],
  [StatusCodes.SERVICE_UNAVAILABLE, false],
  [StatusCodes.GATEWAY_TIMEOUT, false],
  [StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS, true],
  [StatusCodes.GONE, true],
  [StatusCodes.NOT_FOUND, true],
  [StatusCodes.BAD_REQUEST, false],
] as const)(
  "returns %s for %s status code",
  ([statusCode, expected], { services: { streamService } }) => {
    const result = streamService.isFatalStatusCode(statusCode);

    expect(result).toBe(expected);
  },
);
