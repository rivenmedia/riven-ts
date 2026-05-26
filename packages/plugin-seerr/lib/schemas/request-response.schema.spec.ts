import { expect, it } from "vitest";

import { RequestResponse } from "./request-response.schema.ts";

it("allows Seerr requests with null modifiedBy", () => {
  const response = RequestResponse.parse({
    results: [
      {
        id: 1,
        status: 2,
        type: "movie",
        modifiedBy: null,
      },
    ],
  });

  expect(response.results?.[0]?.modifiedBy).toBeNull();
});
