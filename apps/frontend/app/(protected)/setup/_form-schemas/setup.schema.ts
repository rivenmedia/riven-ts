import z from "zod";

export const SetupForm = z.object({
  test: z.string().optional(),
});
