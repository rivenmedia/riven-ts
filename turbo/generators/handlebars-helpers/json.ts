import type { PlopTypes } from "@turbo/gen";

export function registerJsonHelper(plop: PlopTypes.NodePlopAPI) {
  plop.setHelper("json", function (context: unknown) {
    return JSON.stringify(context, null, 2);
  });
}
