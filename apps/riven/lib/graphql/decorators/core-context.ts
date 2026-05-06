import {
  type ApolloServerContext,
  CoreKey,
} from "@repo/core-util-graphql-schema";

import { createParameterDecorator } from "type-graphql";

/**
 * Parameter decorator used to inject the core context.
 *
 * @returns The core context instance
 */
export function CoreContext() {
  return createParameterDecorator<ApolloServerContext>(
    ({ context }) => context[CoreKey],
  );
}

export type CoreContext = ApolloServerContext[typeof CoreKey];
