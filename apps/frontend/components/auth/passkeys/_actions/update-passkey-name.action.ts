import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "#lib/auth/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

import { PasskeyFormSchema } from "../passkey.form-schema";

export const updatePasskeyName = loggedInActionClient
  .inputSchema(PasskeyFormSchema)
  .bindArgsSchemas([z.string().min(1)])
  .action(
    async ({
      bindArgsParsedInputs: [passkeyId],
      parsedInput: { passkeyName },
    }) => {
      try {
        const { error } = await authClient.passkey.updatePasskey({
          id: passkeyId,
          name: passkeyName,
        });

        if (error) {
          toast.error(error.message ?? "Failed to update passkey name");
        } else {
          toast.success("Passkey name updated successfully!");
        }
      } catch {
        toast.error("Failed to update passkey name");
      }
    },
  );
