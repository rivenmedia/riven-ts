import type {
  ActionResult,
  ActionTarget,
  ItemAction,
  MediaItemType,
} from "./types.ts";

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mockAction(
  message: string,
): (target: ActionTarget) => Promise<ActionResult> {
  return async (target) => {
    await delay(400);

    return { status: "success", message: `${message}: ${target.title} (mock)` };
  };
}

/**
 * The exact set of actions a user should be able to perform against a media
 * item hasn't been decided yet, and the mutations they'd call don't all
 * exist in the GraphQL API. This registry is the extension point for them:
 * each entry below is a mock that resolves after a short delay instead of
 * calling a real mutation. Swapping a mock `run` for a real one (e.g. a
 * `resetMediaItem` or `removeItemRequest` call) is the only change needed -
 * the UI already knows how to list, select, and invoke whatever is
 * registered here.
 */
export const ACTIONS: readonly ItemAction[] = [
  {
    id: "retry",
    label: "Retry",
    description: "Reset the item and re-queue it for processing.",
    appliesTo: ["Movie", "Show", "Season", "Episode"],
    run: mockAction("Retry queued"),
  },
  {
    id: "blacklist-active-stream",
    label: "Blacklist active stream",
    description:
      "Blacklist the currently active stream and search for a replacement.",
    appliesTo: ["Movie", "Show", "Season", "Episode"],
    run: mockAction("Active stream blacklisted"),
  },
  {
    id: "remove-request",
    label: "Remove request",
    description: "Remove the item request, halting further processing.",
    appliesTo: ["Movie", "Show"],
    run: mockAction("Item request removed"),
  },
];

export function getActionsFor(type: MediaItemType): ItemAction[] {
  return ACTIONS.filter((action) => action.appliesTo.includes(type));
}
