import type { PlopTypes } from "@turbo/gen";

export function registerArrayHelper(plop: PlopTypes.NodePlopAPI) {
  plop.setHelper("array", function arrayHelper(...args: unknown[]) {
    return args;
  });
}
