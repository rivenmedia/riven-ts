import { type } from "arktype";

const MdbListNameSegment = type(/^[^/]+$/);

export const MdbListName = z.templateLiteral([
  MdbListNameSegment,
  "/",
  MdbListNameSegment,
]);

export type MdbListName = z.infer<typeof MdbListName>;
