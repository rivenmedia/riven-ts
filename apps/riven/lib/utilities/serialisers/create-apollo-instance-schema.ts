import { UUID } from "@rivenmedia/plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import type { EntityClass } from "@mikro-orm/core";

/**
 *
 * @param entities The entity or entities that should match the response schema.
 *
 * @example
 *
 * // For a simple entity with no subclasses,
 * // just provide the class to match the __typename of the entity.
 *
 * class User {}
 *
 * // The schema will match any object with a __typename of "User",
 * // and an id that is a UUID.
 * const schema = createApolloInstanceSchema(User);
 *
 * type T = {
 *   __typename: "User";
 *  id: UUID;
 * }
 *
 * @example
 *
 * // For an entity that has subclasses,
 * // you can provide multiple classes to match the __typename of any of the classes.
 * // This is important, as Apollo will only return the __typename of the most specific class.
 *
 * class Person {}
 *
 * class Employee extends Person {}
 *
 * // The schema will match any object with a __typename of "Person" or "Employee",
 * // and an id that is a UUID.
 * const schema = createApolloInstanceSchema(Person, Employee);
 *
 * type T = {
 *   __typename: "Person" | "Employee";
 *   id: UUID;
 * }
 *
 * @returns
 *
 * A Zod schema that represents the return value of the entity from Apollo.
 */
export function createApolloInstanceSchema(
  ...entities: [EntityClass, ...EntityClass[]]
) {
  const literalSet = new Set(entities.map((e) => e.name));

  return z.object({
    __typename: z.literal([...literalSet]),
    id: UUID,
  });
}
