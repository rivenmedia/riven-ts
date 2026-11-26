import { isEqual } from "es-toolkit";
import { useState } from "react";

/**
 * Keeps returning the same reference while the value stays deeply equal, so a
 * caller passing new but equal arrays or objects doesn't invalidate memos.
 */
export function useStableValue<T>(value: T): T {
  const [stable, setStable] = useState(value);

  if (isEqual(stable, value)) {
    return stable;
  }

  setStable(value);

  return value;
}
