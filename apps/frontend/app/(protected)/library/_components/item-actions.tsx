import { Button } from "@/components/ui/button";

import { ListChecks, LoaderCircle, Trash, X } from "lucide-react";
import { toast } from "react-toastify";

import { removeItems } from "../_actions/remove-items.action";
import { resetItems } from "../_actions/reset-items.action";
import { retryItems } from "../_actions/retry-items.action";
import { ActionButton } from "./action-button";

interface ItemActionsProps {
  selectedItemIds: string[];
}

export function ItemActions({ selectedItemIds }: ItemActionsProps) {
  return (
    <div
      // transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
      className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-3xl border border-white/10 bg-zinc-900/80 p-2 pl-4 shadow-2xl backdrop-blur-xl"
    >
      <div className="mr-4 flex items-center gap-3">
        <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold">
          {selectedItemIds.length}
        </div>
        <span className="text-sm font-medium text-zinc-300">Selected</span>
      </div>
      <div className="mx-1 h-8 w-px bg-white/10"></div>
      <div className="flex items-center gap-1">
        <ActionButton
          label="Reset"
          icon={ListChecks}
          action={async () => {
            try {
              const result = await resetItems({ ids: selectedItemIds });

              if (result.data?.count && result.data.count > 0) {
                toast.success(`Reset ${result.data.count.toString()} items`);
              } else {
                toast.info("No matching items were reset");
              }

              // itemsStore.clear();

              // await refreshLiveLibrary();
            } catch (e) {
              toast.error(
                e instanceof Error
                  ? `Error: ${e.message}`
                  : "An unknown error occurred",
              );
            }
          }}
        />

        <ActionButton
          label="Retry"
          icon={LoaderCircle}
          action={async () => {
            try {
              const result = await retryItems({ ids: selectedItemIds });

              if (result.data?.count && result.data.count > 0) {
                toast.success(
                  `Marked ${result.data.count.toString()} items for retry`,
                );
              } else {
                toast.info("No matching items were marked for retry");
              }

              // itemsStore.clear();

              // await refreshLiveLibrary();
            } catch (e) {
              toast.error(
                e instanceof Error
                  ? `Error: ${e.message}`
                  : "An unknown error occurred",
              );
            }
          }}
        />

        <ActionButton
          label="Remove"
          icon={Trash}
          action={async () => {
            try {
              await removeItems({ ids: selectedItemIds });

              toast.success(
                `Removed ${selectedItemIds.length.toString()} items`,
              );

              // selectedItemIds = [];

              // await refreshLiveLibrary();
            } catch (e) {
              toast.error(
                e instanceof Error
                  ? `Error: ${e.message}`
                  : "An unknown error occurred",
              );
            }
          }}
          variant="destructive"
        />

        <div className="mx-1 h-8 w-px bg-white/10"></div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-white/10"
          // onClick={() => itemsStore.clear()}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
