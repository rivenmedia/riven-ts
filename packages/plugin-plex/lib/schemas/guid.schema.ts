import assert from "node:assert";
import { z } from "zod";

export const Guid = z
  .object({
    id: z.templateLiteral([
      z.string().min(1),
      z.literal("://"),
      z.string().min(1),
    ]),
  })
  .transform((guid) => {
    const [type, id] = guid.id.split("://");

    // This should never trigger due to the template literal validation,
    // but array destructuring requires a check to satisfy TypeScript's type system.
    assert.ok(type && id, "Expected GUID in the format 'type://id'");

    return {
      type,
      id,
    };
  });
