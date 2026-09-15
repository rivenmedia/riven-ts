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
} from "@/components/_ui/alert-dialog";
import { Button } from "@/components/_ui/button";
import { authClient } from "@/lib/auth/client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { User } from "@/lib/auth/client";

interface DeleteUserConfirmationDialogProps {
  user: User;
}

export function DeleteUserConfirmationDialog({
  user,
}: DeleteUserConfirmationDialogProps) {
  const form = useForm();

  const handleSubmit = form.handleSubmit(async () => {
    const { success } = await authClient.admin.removeUser({
      userId: user.id,
    });

    if (success) {
      toast.success("User deleted successfully.");
    } else {
      toast.error("Failed to delete user. Please try again.");
    }
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
      <AlertDialogContent asChild>
        <form
          method="POST"
          // action="?/deleteManagedUser"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <input
            {...form.register("userId", { value: user.id })}
            type="hidden"
          />
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user from the system. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" variant="destructive">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
