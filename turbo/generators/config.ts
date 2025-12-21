import type { PlopTypes } from "@turbo/gen";
import { createPackageGenerator } from "./generators/package";
import { createPluginGenerator } from "./generators/plugin";
import { registerEqualsHelper } from "./handlebars-helpers/equals";
import { registerArrayHelper } from "./handlebars-helpers/array";
import { registerPackageJsonFieldsHelper } from "./handlebars-helpers/package-json-fields";

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
