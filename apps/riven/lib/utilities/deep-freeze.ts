import type { Jsonifiable, ReadonlyDeep } from "type-fest";

export function deepFreeze<T extends Jsonifiable>(obj: T) {
  for (const value of Object.values(obj as Record<string, Jsonifiable>)) {
    if (!Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj) as ReadonlyDeep<T>;
}
