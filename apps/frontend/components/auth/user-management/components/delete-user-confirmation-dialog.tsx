import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "#components/_ui/alert-dialog.tsx";
import { Button } from "#components/_ui/button.tsx";

import { DeleteUserConfirmationButton } from "./delete-user-confirmation-button";

import type { User } from "#lib/auth/client.ts";

interface DeleteUserConfirmationDialogProps {
  user: User;
}

export function DeleteUserConfirmationDialog({
  user,
}: DeleteUserConfirmationDialogProps) {
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
          <DeleteUserConfirmationButton userId={user.id} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
