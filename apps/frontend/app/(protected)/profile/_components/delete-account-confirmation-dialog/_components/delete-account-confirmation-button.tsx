"use client";

import { AlertDialogAction } from "#components/_ui/alert-dialog.tsx";

import { deleteAccount } from "../delete-account.action";

export function DeleteAccountConfirmationButton() {
  return (
    <AlertDialogAction
      type="button"
      variant="destructive"
      onClick={() => void deleteAccount()}
    >
      Confirm
    </AlertDialogAction>
  );
}
