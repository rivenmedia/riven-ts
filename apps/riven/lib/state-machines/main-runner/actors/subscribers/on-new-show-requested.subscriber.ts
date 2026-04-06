import { type TypedDocumentNode, gql } from "@apollo/client";
import { fromObservable } from "xstate";

import { client } from "../../../../utilities/apollo-client.ts";

import type { OnNewShowRequestCreatedSubscription } from "./on-new-show-requested.subscriber.typegen.ts";

const ON_NEW_SHOW_REQUESTED_SUBSCRIPTION: TypedDocumentNode<OnNewShowRequestCreatedSubscription> = gql`
  subscription OnNewShowRequestCreated {
    newShowRequested {
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
    query: ON_NEW_SHOW_REQUESTED_SUBSCRIPTION,
  }),
);
