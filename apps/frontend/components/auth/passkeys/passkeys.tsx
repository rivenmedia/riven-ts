import { Button } from "@/components/_ui/button";

import { Fingerprint } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { FormBase } from "../form-base/form-base";
import { usePasskeyForm } from "./passkey-form-provider";
import { PasskeyList } from "./passkey-list";

export function Passkeys() {
  const { isRegisteringPasskey, registerPasskey } = usePasskeyForm();

  return (
    <FormBase
      title="Passkeys"
      description="Manage your passkeys for secure, passwordless authentication"
      content={
        <ErrorBoundary
          fallback={
            <p className="text-red-500 text-sm">Failed to load passkeys</p>
          }
        >
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm">
                Loading passkeys...
              </p>
            }
          >
            <PasskeyList />
          </Suspense>
        </ErrorBoundary>
      }
      footer={
        <Button
          variant="outline"
          disabled={isRegisteringPasskey}
          onClick={() => {
            void registerPasskey();
          }}
        >
          <Fingerprint className="mr-2 h-4 w-4" />
          {isRegisteringPasskey ? "Registering..." : "Add Passkey"}
        </Button>
      }
    />
  );
}
