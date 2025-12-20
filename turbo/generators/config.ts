import type { PlopTypes } from "@turbo/gen";
import { createPackageGenerator } from "./generators/package";
import { createPluginGenerator } from "./generators/plugin";
import { registerEqualsHelper } from "./handlebars-helpers/equals";
import { registerArrayHelper } from "./handlebars-helpers/array";
import { registerPackageDependenciesHelper } from "./handlebars-helpers/package-dependencies";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  [
    // Helpers
    registerArrayHelper,
    registerEqualsHelper,
    registerPackageDependenciesHelper,

    // Generators
    createPackageGenerator,
    createPluginGenerator,
  ].forEach((fn) => fn(plop));
}
