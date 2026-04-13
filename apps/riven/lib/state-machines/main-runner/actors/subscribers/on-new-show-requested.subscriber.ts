import { type TypedDocumentNode, gql } from "@apollo/client";
import { fromObservable } from "xstate";

import { client } from "../../../../graphql/apollo-client.ts";

import type { OnShowRequestedSubscription } from "./on-new-show-requested.subscriber.typegen.ts";

const ON_SHOW_REQUESTED_SUBSCRIPTION: TypedDocumentNode<OnShowRequestedSubscription> = gql`
  subscription OnShowRequested {
    showRequested {
      id
      externalIdsLabel
      type
      requestedBy
      createdAt
      state
    }
  }
`;

export const onNewShowRequestedSubscriber = fromObservable(() =>
  client.subscribe({
    query: ON_SHOW_REQUESTED_SUBSCRIPTION,
  }),
);
