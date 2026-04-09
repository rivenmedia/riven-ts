import type { RequestType } from "../request-content-services.schema.ts";

export function calculateRequestResults(
  results: PromiseSettledResult<{ requestType: RequestType }>[],
) {
  return results.reduce<{
    newItems: number;
    updatedItems: number;
  }>(
    (acc, val) => {
      if (val.status === "rejected") {
        return acc;
      }

      if (val.value.requestType === "create") {
        acc.newItems = acc.newItems + 1;

        return acc;
      }

      acc.updatedItems = acc.updatedItems + 1;

      return acc;
    },
    {
      newItems: 0,
      updatedItems: 0,
    },
  );
}
