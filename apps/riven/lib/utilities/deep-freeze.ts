import type { ReadonlyDeep } from "type-fest";

export function deepFreeze<T>(obj: T) {
  Object.values(obj as Record<string, unknown>).forEach(
    (value) => Object.isFrozen(value) || deepFreeze(value),
  );

  return Object.freeze(obj) as ReadonlyDeep<T>;
}
