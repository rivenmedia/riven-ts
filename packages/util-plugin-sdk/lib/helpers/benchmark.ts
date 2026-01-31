import type { Promisable } from "type-fest";

export const benchmark = async <
  T extends (...args: unknown[]) => Promisable<unknown>,
>(
  fn: T,
): Promise<{ result: Awaited<ReturnType<T>>; timeTaken: number }> => {
  const start = performance.now();

  const result = (await fn()) as Awaited<ReturnType<T>>;

  const end = performance.now();
  const timeTaken = end - start;

  return {
    result,
    timeTaken,
  };
};
