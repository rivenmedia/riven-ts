"use client";

import { useState } from "react";

interface UseActionDialogOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

/**
 * Shared dialog state and action callbacks for item actions.
 *
 * The returned `callbacks` can be passed to either `useAction` or
 * `useHookFormAction` (as `actionProps`), so the dialog closes on success
 * regardless of whether the action needs form data.
 */
export function useActionDialog(options?: UseActionDialogOptions) {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    setIsOpen,
    callbacks: {
      onSuccess() {
        setIsOpen(false);

        options?.onSuccess?.();
      },
      onError() {
        options?.onError?.();
      },
    },
  };
}
