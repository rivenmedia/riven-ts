import type {
  ApolloClient,
  CombinedGraphQLErrors,
  TypedDocumentNode,
} from "@apollo/client";
import type { ReactNode } from "react";

export type MediaItemType = "Episode" | "Movie" | "Season" | "Show";

export interface ActionTarget {
  id: string;
  title: string;
  type: MediaItemType;
}

export type ItemAction<
  // oxlint-disable-next-line typescript/no-explicit-any
  D extends TypedDocumentNode<any, any> = TypedDocumentNode<any, any>,
  // oxlint-disable-next-line typescript/no-explicit-any
  ReturnData extends (D extends TypedDocumentNode<infer R, any>
    ? R
    : // oxlint-disable-next-line typescript/no-explicit-any
      Record<string, unknown>) = D extends TypedDocumentNode<infer R, any>
    ? R
    : Record<string, unknown>,
  // oxlint-disable-next-line typescript/no-explicit-any
  Variables extends (D extends TypedDocumentNode<any, infer V>
    ? V
    : // oxlint-disable-next-line typescript/no-explicit-any
      Record<string, unknown>) = D extends TypedDocumentNode<any, infer V>
    ? V
    : Record<string, unknown>,
> = {
  /** Which media item types this action can be performed against. */
  appliesTo: readonly MediaItemType[];
  description: string;
  id: string;
  label: string;
  mutation: D;
  when?: boolean;
  buildResultMessageData: (
    target: ActionTarget,
    data: ApolloClient.MutateResult<ReturnData> | null,
    error: CombinedGraphQLErrors | null,
  ) => {
    type: "success" | "warning" | "error";
    message: ReactNode;
  };
  onComplete?: (
    target: ActionTarget,
    data: ApolloClient.MutateResult<ReturnData>,
  ) => void;
  onError?: (target: ActionTarget, error: CombinedGraphQLErrors) => void;
} & (Variables extends Record<string, never>
  ? { variables?: never }
  : { variables: Variables });
