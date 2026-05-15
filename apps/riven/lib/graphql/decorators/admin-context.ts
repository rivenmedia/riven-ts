import {
  AdminKey,
  type ApolloServerContext,
} from "@repo/core-util-graphql-schema";

import { createParameterDecorator } from "type-graphql";

/**
 * Parameter decorator used to inject the admin context — the live
 * registered-plugin map plus a flat snapshot of every BullMQ queue
 * the main-runner currently owns.
 *
 * Use on admin / introspection resolvers that need to read runtime
 * job state without re-traversing the xstate context. The slot is
 * populated per request by `buildContextFunction`, so the queue map
 * reflects the latest snapshot at the moment the resolver runs.
 *
 * @returns The admin context slot
 */
export function AdminContext() {
  return createParameterDecorator<ApolloServerContext>(
    ({ context }) => context[AdminKey],
  );
}

export type AdminContext = ApolloServerContext[typeof AdminKey];
