import type { ItemAction } from "../types/actions.ts";
import type { TypedDocumentNode } from "@apollo/client";

export function createAction<T extends TypedDocumentNode<any, any>>(
  document: T,
  action: Omit<ItemAction<T>, "mutation">,
) {
  return {
    ...action,
    mutation: document,
  };
}
