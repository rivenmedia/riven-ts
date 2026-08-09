export type MediaItemType = "Episode" | "Movie" | "Season" | "Show";

export interface ActionTarget {
  id: string;
  title: string;
  type: MediaItemType;
}

export interface ActionResult {
  message: string;
  status: "error" | "success";
}

export interface ItemAction {
  /** Which media item types this action can be performed against. */
  appliesTo: readonly MediaItemType[];
  description: string;
  id: string;
  label: string;
  run: (target: ActionTarget) => Promise<ActionResult>;
}
