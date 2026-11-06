import z from "zod";

export const TestSettings = z.object({}).meta({ title: "Test" });

export type TestSettings = z.infer<typeof TestSettings>;
