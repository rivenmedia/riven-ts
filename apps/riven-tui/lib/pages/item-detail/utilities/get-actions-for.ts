import type { ItemAction, MediaItemType } from "../../../types/actions.ts";

export function getActionsFor(
  actions: readonly ItemAction[],
  type: MediaItemType,
): ItemAction[] {
  return actions.filter((action) => action.appliesTo.includes(type));
}
