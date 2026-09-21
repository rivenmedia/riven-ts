import assert from "node:assert";
import { z } from "zod";

const GuidString = z.templateLiteral([
  z.string().min(1),
  z.literal("://"),
  z.string().min(1),
]);

export const Guid = z
  .union([GuidString, z.object({ id: GuidString })])
  .transform((guid) => {
    const target = typeof guid === "string" ? guid : guid.id;
    const [type, id] = target.split("://");

    // This should never trigger due to the template literal validation,
    // but array destructuring requires a check to satisfy TypeScript's type system.
    assert.ok(type && id, "Expected GUID in the format 'type://id'");

    return {
      type,
      id,
    };
  });
