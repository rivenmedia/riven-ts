import { createPackageGenerator } from "./generators/package";
import { createPluginGenerator } from "./generators/plugin";
import { registerArrayHelper } from "./handlebars-helpers/array";
import { registerEqualsHelper } from "./handlebars-helpers/equals";
import { registerPackageJsonFieldsHelper } from "./handlebars-helpers/package-json-fields";

import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  [
    // Helpers
    registerArrayHelper,
    registerEqualsHelper,
    registerPackageJsonFieldsHelper,

    // Generators
    createPackageGenerator,
    createPluginGenerator,
  ].forEach((fn) => fn(plop));
}
