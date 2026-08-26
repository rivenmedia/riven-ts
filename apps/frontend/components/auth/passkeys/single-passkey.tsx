import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Spinner } from "@/components/_ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/_ui/tooltip";
import { authClient } from "@/lib/auth/client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Fingerprint, Pencil, X } from "lucide-react";
import { DateTime } from "luxon";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { usePasskeyForm } from "./passkey-form-provider";
import { PasskeyFormSchema } from "./passkey-form-schema";

import type { Passkey } from "@better-auth/passkey/client";

interface SinglePasskeyProps {
  passkey: Passkey;
}

export function SinglePasskey({ passkey }: SinglePasskeyProps) {
  const {
    currentlyEditingPasskey,
    deletePasskey,
    cancelEditingPasskey,
    startEditingPasskey,
    reloadPasskeys,
    clearCurrentlyEditingPasskey,
  } = usePasskeyForm();

  const isEditing = currentlyEditingPasskey?.id === passkey.id;

  const form = useForm({
    resolver: zodResolver(PasskeyFormSchema),
    defaultValues: {
      passkeyName: passkey.name ?? "",
    },
    disabled: !isEditing,
    shouldUseNativeValidation: true,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const { error } = await authClient.passkey.updatePasskey({
        id: passkey.id,
        name: data.passkeyName,
      });

      if (error) {
        toast.error(error.message ?? "Failed to update passkey name");
      } else {
        toast.success("Passkey name updated successfully!");

        clearCurrentlyEditingPasskey();

        reloadPasskeys();
      }
    } catch {
      toast.error("Failed to update passkey name");
    }
  });

  const { isSubmitting } = form.formState;

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <div className="border-border/60 flex items-center justify-between border-b py-3">
        <div className="flex flex-1 items-center gap-3">
          <Fingerprint className="text-muted-foreground h-5 w-5" />
          <div className="flex-1">
            {isEditing ? (
              <Input
                {...form.register("passkeyName", { required: true })}
                placeholder="Enter passkey name"
                className="h-8"
              />
            ) : (
              <p className="text-sm font-medium">
                {passkey.name ?? "Unnamed Passkey"}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Created{" "}
              {DateTime.fromJSDate(passkey.createdAt).toLocaleString(
                DateTime.DATE_SHORT,
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Save passkey name"
                    size="icon"
                    variant="ghost"
                    disabled={isSubmitting}
                    className="h-8 w-8"
                    type="submit"
                  >
                    {isSubmitting ? <Spinner /> : <Check className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Cancel editing passkey name"
                    size="icon"
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={cancelEditingPasskey}
                    className="h-8 w-8"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Edit passkey name"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      startEditingPasskey(passkey);
                    }}
                    className="h-8 w-8"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Button
                aria-label="Delete passkey"
                variant="destructive"
                size="sm"
                onClick={() => {
                  void deletePasskey(passkey.id);
                }}
                type="button"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
