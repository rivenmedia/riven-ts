import { Directive } from "type-graphql";

import type { CacheHint } from "@apollo/cache-control-types";
import type { RequireAtLeastOne } from "type-fest";

export function CacheControl({ maxAge, scope }: RequireAtLeastOne<CacheHint>) {
  if (maxAge === undefined && scope === undefined) {
    throw new Error("Missing maxAge or scope param for @CacheControl");
  }

  const sdl = String.raw(
    { raw: ["@cacheControl(", " ", ")"] },
    maxAge !== undefined ? `maxAge: ${maxAge.toString()}` : "",
    scope ? `scope: ${scope}` : "",
  );

  return Directive(sdl);
}
