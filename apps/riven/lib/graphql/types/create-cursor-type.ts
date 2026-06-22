import { Field, ObjectType } from "type-graphql";

import { PaginationResult } from "./pagination-result.ts";

import type { Cursor, Loaded } from "@mikro-orm/core";

export function createCursorType<T extends object>(name: string, entity: T) {
  @ObjectType(`${name}Cursor`, { implements: PaginationResult })
  abstract class Edge implements Pick<Cursor<T>, "items"> {
    @Field(() => [entity])
    items!: Loaded<T>[];
  }

  return Edge;
}
