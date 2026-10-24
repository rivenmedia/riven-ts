"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { AlertDialogAction } from "#components/_ui/alert-dialog.tsx";

import { deleteUser } from "../_actions/delete-user.action";

interface DeleteUserConfirmationButtonProps {
  userId: string;
}

export function DeleteUserConfirmationButton({
  userId,
}: DeleteUserConfirmationButtonProps) {
  const deleteUserAction = useAction(deleteUser, {
    onError() {
      toast.error("Failed to delete user.");
    },
    onSuccess() {
      toast.success("User deleted successfully.");
    },
  });

  return (
    <AlertDialogAction
      variant="destructive"
      onClick={() => {
        deleteUserAction.execute(userId);
      }}
      type="button"
    >
      Confirm
    </AlertDialogAction>
  );
}
