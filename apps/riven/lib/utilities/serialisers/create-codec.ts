import type { Type } from "arktype";
import type { Promisable } from "type-fest";

export interface Codec<
  E extends (data: unknown) => Promisable<unknown>,
  D extends (data: unknown) => Promisable<unknown>,
> {
  encode: E;
  decode: D;
}

export function createCodec<
  E extends Type,
  D extends Type,
  EF extends (data: D["infer"]) => Promisable<E["infer"]>,
  DF extends (data: E["infer"]) => Promisable<D["infer"]>,
>(
  encodeSchema: E,
  decodeSchema: D,
  {
    encode,
    decode,
  }: {
    encode: EF;
    decode: DF;
  },
): Codec<typeof encode, typeof decode> {
  return {
    encode: (data: unknown) => encodeSchema.assert(encode(data)),
    decode: (data: unknown) => decodeSchema.assert(decode(data)),
  };
}
