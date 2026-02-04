import type { Jsonifiable, ReadonlyDeep } from "type-fest";

export function deepFreeze<T extends Jsonifiable>(obj: T) {
  Object.values(obj as Record<string, Jsonifiable>).forEach(
    (value) => Object.isFrozen(value) || deepFreeze(value),
  );

  return Object.freeze(obj) as ReadonlyDeep<T>;
}
