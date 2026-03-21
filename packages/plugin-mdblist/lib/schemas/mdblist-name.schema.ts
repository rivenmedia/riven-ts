import z from "zod";

export const MdbListName = z.templateLiteral([
  z.string().min(1),
  "/",
  z.string().min(1),
]);

export type MdbListName = z.infer<typeof MdbListName>;
