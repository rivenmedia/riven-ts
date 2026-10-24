import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "#components/_ui/alert-dialog.tsx";
import { Button } from "#components/_ui/button.tsx";

import { deleteUser } from "../_actions/delete-user.action";

import type { User } from "#lib/auth/client.ts";

interface DeleteUserConfirmationDialogProps {
  user: User;
}

export function DeleteUserConfirmationDialog({
  user,
}: DeleteUserConfirmationDialogProps) {
  const deleteUserAction = useAction(deleteUser, {
    onError() {
      toast.error("Failed to delete user.");
    },
    onSuccess() {
      toast.success("User deleted successfully.");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Delete user: ${user.name}`}
          type="button"
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the user from the system. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              deleteUserAction.execute(user.id);
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
