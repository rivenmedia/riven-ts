import { use } from "react";

import { usePasskeyForm } from "./passkey-form-provider";
import { SinglePasskey } from "./single-passkey";

export function PasskeyList() {
  const { loadPasskeys } = usePasskeyForm();
  const passkeys = use(loadPasskeys);

  if (passkeys.length === 0) {
    return (
      <p className="text-muted-foreground mb-4 text-sm">
        No passkeys registered yet. Add a passkey for faster, more secure login.
      </p>
    );
  }

  return (
    <div className="border-border/60 mb-4 border-t">
      {passkeys.map((passkey) => (
        <SinglePasskey key={passkey.id} passkey={passkey} />
      ))}
    </div>
  );
}
