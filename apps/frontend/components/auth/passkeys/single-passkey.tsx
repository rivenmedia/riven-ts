import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Check, Fingerprint, Pencil, X } from "lucide-react";
import { DateTime } from "luxon";

import { Button } from "#components/_ui/button.tsx";
import { Input } from "#components/_ui/input.tsx";
import { Spinner } from "#components/_ui/spinner.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#components/_ui/tooltip.tsx";

import { updatePasskeyName } from "./_actions/update-passkey-name.action.ts";
import { usePasskeyForm } from "./passkey-form-provider.tsx";
import { PasskeyFormSchema } from "./passkey.form-schema.ts";

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

  const { form, handleSubmitWithAction } = useHookFormAction(
    updatePasskeyName.bind(null, passkey.id),
    zodResolver(PasskeyFormSchema),
    {
      actionProps: {
        onSuccess() {
          clearCurrentlyEditingPasskey();
          reloadPasskeys();
        },
      },
      formProps: {
        defaultValues: {
          passkeyName: passkey.name ?? "",
        },
        disabled: !isEditing,
        shouldUseNativeValidation: true,
      },
    },
  );

  const { isSubmitting } = form.formState;

  return (
    <form onSubmit={(event) => void handleSubmitWithAction(event)}>
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
