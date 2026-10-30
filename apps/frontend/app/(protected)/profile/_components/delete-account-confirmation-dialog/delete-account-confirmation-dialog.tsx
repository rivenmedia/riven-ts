import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#components/_ui/alert-dialog.tsx";
import { Button } from "#components/_ui/button.tsx";

import { DeleteAccountConfirmationButton } from "./_components/delete-account-confirmation-button";

export function DeleteAccountConfirmationDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          type="button"
        >
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your user from the system. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <DeleteAccountConfirmationButton />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
