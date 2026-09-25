import { authClient } from "@/lib/auth/client";

import {
  createContext,
  startTransition,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUnmount } from "react-use";
import { toast } from "sonner";

import type { Passkey } from "@better-auth/passkey/client";
import type { PropsWithChildren } from "react";

interface PasskeyFormContextValue {
  loadPasskeys: Promise<Passkey[]>;
  isRegisteringPasskey: boolean;
  currentlyEditingPasskey: Passkey | null;
  cancelEditingPasskey: () => void;
  clearCurrentlyEditingPasskey: () => void;
  deletePasskey: (passkeyId: string) => Promise<void>;
  registerPasskey: () => Promise<void>;
  reloadPasskeys: () => void;
  startEditingPasskey: (passkey: Passkey) => void;
}

const PasskeyFormContext = createContext<PasskeyFormContextValue | undefined>(
  undefined,
);

export function PasskeyFormProvider({ children }: PropsWithChildren) {
  const abortController = useMemo(() => new AbortController(), []);
  const passkeyLoaderRef = useRef<Promise<Passkey[]> | null>(null);

  function createPasskeyLoader() {
    passkeyLoaderRef.current ??= authClient.passkey
      .listUserPasskeys({
        fetchOptions: {
          signal: abortController.signal,
          throw: true,
        },
      })
      .finally(() => {
        passkeyLoaderRef.current = null;
      });

    return passkeyLoaderRef.current;
  }

  useUnmount(() => {
    abortController.abort();
    passkeyLoaderRef.current = null;
  });

  const [loadPasskeys, setLoadPasskeys] = useState<Promise<Passkey[]>>(() =>
    createPasskeyLoader(),
  );

  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [currentlyEditingPasskey, setCurrentlyEditingPasskey] =
    useState<Passkey | null>(null);

  function reloadPasskeys() {
    startTransition(() => {
      setLoadPasskeys(createPasskeyLoader());
    });
  }

  function startEditingPasskey(passkey: Passkey) {
    setCurrentlyEditingPasskey(passkey);
  }

  function cancelEditingPasskey() {
    setCurrentlyEditingPasskey(null);
  }

  async function registerPasskey() {
    setIsRegisteringPasskey(true);

    try {
      await authClient.passkey.addPasskey({
        fetchOptions: {
          onSuccess() {
            toast.success("Passkey registered successfully!");

            reloadPasskeys();
          },
          onError(context) {
            toast.error(context.error.message || "Failed to register passkey");
          },
        },
      });
    } catch {
      toast.error("Failed to register passkey");
    } finally {
      setIsRegisteringPasskey(false);
    }
  }

  async function deletePasskey(id: string) {
    try {
      await authClient.passkey.deletePasskey({
        id,
        fetchOptions: {
          onSuccess() {
            toast.success("Passkey deleted successfully");

            reloadPasskeys();
          },
          onError(context) {
            toast.error(context.error.message || "Failed to delete passkey");
          },
        },
      });
    } catch {
      toast.error("Failed to delete passkey");
    }
  }

  function clearCurrentlyEditingPasskey() {
    setCurrentlyEditingPasskey(null);
  }

  const value = useMemo<PasskeyFormContextValue>(
    () => ({
      loadPasskeys,
      currentlyEditingPasskey,
      isRegisteringPasskey,
      cancelEditingPasskey,
      deletePasskey,
      registerPasskey,
      reloadPasskeys,
      startEditingPasskey,
      clearCurrentlyEditingPasskey,
    }),
    [loadPasskeys, currentlyEditingPasskey, isRegisteringPasskey],
  );

  return (
    <PasskeyFormContext.Provider value={value}>
      {children}
    </PasskeyFormContext.Provider>
  );
}

export function usePasskeyForm() {
  const context = useContext(PasskeyFormContext);

  if (!context) {
    throw new Error("usePasskeyForm must be used within a PasskeyFormProvider");
  }

  return context;
}
