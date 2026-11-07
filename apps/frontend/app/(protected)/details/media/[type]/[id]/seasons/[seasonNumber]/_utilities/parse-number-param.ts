import { z } from "zod";

const NumberParam = z.coerce.number().int().nonnegative();

/**
 * Parses a season or episode number route param.
 *
 * @returns The parsed number, or `null` if the param isn't a non-negative integer
 */
export function parseNumberParam(param: string) {
  const result = NumberParam.safeParse(param);

  return result.success ? result.data : null;
}
