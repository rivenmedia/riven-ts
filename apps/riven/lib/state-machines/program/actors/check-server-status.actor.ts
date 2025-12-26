import type {
  CheckServerStatusQuery,
  CheckServerStatusQueryVariables,
} from "./check-server-status.actor.typegen.ts";
import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client";
import { fromPromise } from "xstate";

export const CHECK_SERVER_STATUS: TypedDocumentNode<
  CheckServerStatusQuery,
  CheckServerStatusQueryVariables
> = gql`
  query CheckServerStatus {
    settings {
      riven {
        version
      }
    }
  }
`;

export interface CheckServerStatusInput {
  client: ApolloClient;
}

export const checkServerStatus = fromPromise<undefined, CheckServerStatusInput>(
  async ({ input: { client } }) => {
    await client.query({
      query: CHECK_SERVER_STATUS,
    });
  },
);
