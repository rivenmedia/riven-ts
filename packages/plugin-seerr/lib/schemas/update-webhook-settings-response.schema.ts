import z from "zod";

import { webhookSettingsSchema } from "../__generated__/zod/webhookSettingsSchema.ts";

export const UpdateWebhookSettingsResponse = webhookSettingsSchema.extend({
  options: webhookSettingsSchema.shape.options.unwrap().extend({
    jsonPayload: z.base64().transform((val) => {
      const decoded = Buffer.from(val, "base64").toString("utf-8");

      try {
        return JSON.parse(decoded) as Record<string, never>;
      } catch (e) {
        throw new Error("Failed to parse jsonPayload as JSON", { cause: e });
      }
    }),
  }),
});
