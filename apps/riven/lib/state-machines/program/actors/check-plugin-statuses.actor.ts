import type {
  CheckPluginStatusesQuery,
  CheckPluginStatusesQueryVariables,
} from "./check-plugin-statuses.actor.typegen.ts";
import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client";
import { fromPromise } from "xstate";

export const CHECK_PLUGIN_STATUSES: TypedDocumentNode<
  CheckPluginStatusesQuery,
  CheckPluginStatusesQueryVariables
> = gql`
  query CheckPluginStatuses {
    settings {
      riven {
        version
      }
    }
  }
`;

export interface CheckPluginStatusesInput {
  client: ApolloClient;
}

export const checkPluginStatuses = fromPromise<
  undefined,
  CheckPluginStatusesInput
>(async ({ input: { client } }) => {
  await client.query({ query: CHECK_PLUGIN_STATUSES });
});
