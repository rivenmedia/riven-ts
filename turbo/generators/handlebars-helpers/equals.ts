import type { PlopTypes } from "@turbo/gen";

export function registerEqualsHelper(plop: PlopTypes.NodePlopAPI) {
  plop.setHelper("equals", (arg1: unknown, arg2: unknown) => arg1 === arg2);
}
