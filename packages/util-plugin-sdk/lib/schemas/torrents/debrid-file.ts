import { type } from "arktype";

export const DebridFile = type({
  "link?": "string > 0",
  name: "string",
  path: "string",
  size: "number.integer >= 0",
});

export type DebridFile = typeof DebridFile.infer;
