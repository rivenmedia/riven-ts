import type { Type } from "arktype";
import type { Promisable } from "type-fest";

export interface Codec<E extends Type, D extends Type> {
  encode: (data: D["infer"]) => Promisable<E["infer"]>;
  decode: (data: E["infer"]) => Promisable<D["infer"]>;
}

export function createCodec<E extends Type, D extends Type>(
  encodeSchema: E,
  decodeSchema: D,
  {
    encode,
    decode,
  }: {
    encode: (data: D["infer"]) => Promisable<E["infer"]>;
    decode: (data: E["infer"]) => Promisable<D["infer"]>;
  },
) {
  return {
    encode: (data: unknown) => encodeSchema.assert(encode(data)),
    decode: (data: unknown) => decodeSchema.assert(decode(data)),
  };
}
