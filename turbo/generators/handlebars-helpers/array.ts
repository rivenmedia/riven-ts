import type { PlopTypes } from "@turbo/gen";

export function registerArrayHelper(plop: PlopTypes.NodePlopAPI) {
  plop.addHelper("array", function (...args: unknown[]) {
    return args;
  });
}
