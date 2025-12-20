import type { PlopTypes } from "@turbo/gen";

export function registerEqualsHelper(plop: PlopTypes.NodePlopAPI) {
  plop.addHelper("equals", function (arg1: unknown, arg2: unknown) {
    return arg1 === arg2;
  });
}
