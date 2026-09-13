import type { ItemAction } from "../types/actions.ts";
import type { TypedDocumentNode } from "@apollo/client";

// oxlint-disable-next-line typescript/no-explicit-any
export function createAction<T extends TypedDocumentNode<any, any>>(
  document: T,
  action: Omit<ItemAction<T>, "mutation">,
) {
  return {
    ...action,
    mutation: document,
  };
}
