import z from "zod";

export const AddMagnetResponse = z.object({
  id: z.string(),
});

export type AddMagnetResponse = z.infer<typeof AddMagnetResponse>;
