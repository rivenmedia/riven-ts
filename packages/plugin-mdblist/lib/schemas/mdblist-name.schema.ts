import z from "zod";

const MdbListNameSegment = z
  .string()
  .min(1)
  .regex(/^[^/]+$/u);

export const MdbListName = z.templateLiteral([
  MdbListNameSegment,
  "/",
  MdbListNameSegment,
]);

export type MdbListName = z.infer<typeof MdbListName>;
