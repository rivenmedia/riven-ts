import { LogLevel } from "@repo/feature-settings/enums/log-level.enum";

import { z } from "zod";

export const GeneralTabFormSchema = z.object({
  instanceName: z.string().min(1, "Instance Name is required").default("Riven"),
  logLevel: z.enum(LogLevel).default(LogLevel.INFO),
  enableNotifications: z.boolean().default(false),
});

export type GeneralTabFormValues = z.infer<typeof GeneralTabFormSchema>;
