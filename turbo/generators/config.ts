import { createPackageGenerator } from "./generators/package.ts";
import { createPluginGenerator } from "./generators/plugin.ts";
import { registerArrayHelper } from "./handlebars-helpers/array.ts";
import { registerEqualsHelper } from "./handlebars-helpers/equals.ts";
import { registerJsonHelper } from "./handlebars-helpers/json.ts";
import { registerPackageJsonFieldsHelper } from "./handlebars-helpers/package-json-fields.ts";

import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  [
    // Helpers
    registerArrayHelper,
    registerEqualsHelper,
    registerPackageJsonFieldsHelper,
    registerJsonHelper,

    // Generators
    createPackageGenerator,
    createPluginGenerator,
  ].forEach((fn) => fn(plop));
}
