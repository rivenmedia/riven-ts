import { Pause, Play, RefreshCw, Trash2, CircleSlash } from "lucide-react";

import { blacklistActiveStream } from "./actions/blacklist-active-stream/_actions/blacklist-active-stream.action.ts";
import { deleteItem } from "./actions/delete-item/_actions/delete-item.action.ts";
import { pauseItem } from "./actions/pause-item/_actions/pause-item.action.ts";
import { resetItem } from "./actions/reset-item/_actions/reset-item.action.ts";
import { resumeItem } from "./actions/resume-item/_actions/resume-item.action.ts";
import { retryItem } from "./actions/retry-item/_actions/retry-item.action.ts";

import type { ConfirmItemActionProps } from "./actions/_components/confirm-item-action.tsx";
import type { MediaItemAction } from "@repo/util-plugin-sdk/dto/enums/media-item-action.enum";
import type { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";
import type { SafeActionFn } from "next-safe-action";

interface ConfirmItemActionConfig extends Omit<
  ConfirmItemActionProps,
  "action" | "title"
> {
  /** The available action that enables this item action. */
  availableAction: MediaItemAction;
  /** The entity whose ID is bound to the action. */
  target: "itemRequest" | "mediaItem";
  action: SafeActionFn<unknown, undefined, [typeof UUID], unknown, unknown>;
  /** Precedes the item's title in the confirmation dialog, e.g. `Pausing "Title"`. */
  pendingLabel: string;
}

/**
 * The item actions that only need confirming, in the order they are displayed.
 */
export const confirmItemActions: ConfirmItemActionConfig[] = [
  {
    availableAction: "reset",
    target: "mediaItem",
    action: resetItem,
    label: "Reset",
    pendingLabel: "Resetting",
    icon: <RefreshCw />,
    successMessage: "Reset successful",
    errorMessage: "Reset failed",
  },
  {
    availableAction: "retry",
    target: "mediaItem",
    action: retryItem,
    label: "Retry",
    pendingLabel: "Retrying",
    icon: <RefreshCw />,
    successMessage: "Item retried successfully.",
    errorMessage: "Failed to retry the item.",
  },
  {
    availableAction: "resume",
    target: "mediaItem",
    action: resumeItem,
    label: "Resume",
    pendingLabel: "Resuming",
    icon: <Play />,
    successMessage: "Item resumed successfully.",
    errorMessage: "Failed to resume the item.",
  },
  {
    availableAction: "pause",
    target: "mediaItem",
    action: pauseItem,
    label: "Pause",
    pendingLabel: "Pausing",
    icon: <Pause />,
    successMessage: "Item paused successfully.",
    errorMessage: "Failed to pause the item.",
  },
  {
    availableAction: "blacklist_active_stream",
    target: "mediaItem",
    action: blacklistActiveStream,
    label: "Blacklist Active Stream",
    pendingLabel: "Blacklisting",
    icon: <CircleSlash />,
    successMessage: "Active stream blacklisted successfully.",
    errorMessage: "Failed to blacklist the active stream.",
  },
  {
    availableAction: "delete",
    target: "itemRequest",
    action: deleteItem,
    label: "Delete",
    pendingLabel: "Deleting",
    icon: <Trash2 />,
    variant: "destructive",
    successMessage: "Item deleted successfully",
    errorMessage: "Failed to delete item",
  },
];
