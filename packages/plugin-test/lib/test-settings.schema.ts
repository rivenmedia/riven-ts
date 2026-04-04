import { type } from "arktype";

export const TestSettings = type({});

export type TestSettings = typeof TestSettings.infer;
