import z from "zod";

export const TestSettings = z.object({});

export type TestSettings = z.infer<typeof TestSettings>;
