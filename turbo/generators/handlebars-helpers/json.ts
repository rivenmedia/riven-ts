import type { PlopTypes } from "@turbo/gen";

export function registerJsonHelper(plop: PlopTypes.NodePlopAPI) {
  plop.setHelper("json", (context: unknown) =>
    JSON.stringify(context, null, 2),
  );
}
