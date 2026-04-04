import { ArkError, type } from "arktype";

export const ErrorSplat = type
  .or({ err: type.instanceOf(ArkError) }, type.instanceOf(ArkError))
  .pipe((err) => (err instanceof ArkError ? err : err.err));

export type ErrorSplat = typeof ErrorSplat.infer;
