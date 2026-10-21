import { z } from "zod";

export const RequestShowFormSchema = z.object({
  requestedSeasons: z
    .partialRecord(z.string(), z.boolean().optional())
    .optional(),
});

export type RequestShowFormValues = z.infer<typeof RequestShowFormSchema>;
