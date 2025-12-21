import { installDependenciesAction } from "./actions/install-dependencies";
import { formatOutputCode } from "./actions/format-output";
import type { PlopTypes } from "@turbo/gen";
import { installDependenciesToPackage } from "./actions/install-dependencies-to-package";

interface PluginAnswers {
  pluginName: string;
}

export const createPluginGenerator = (plop: PlopTypes.NodePlopAPI) =>
  plop.setGenerator("plugin", {
    description: "Generate plugin boilerplate",
    prompts: [
      {
        type: "input",
        name: "pluginName",
        message: "Plugin name (e.g., my-plugin):",
      },
      {
        type: "confirm",
        name: "confirm",
        message: (data) => {
          const pluginName = plop.getHelper("kebabCase")(data.pluginName);
          const packageIdentifier = `@repo/plugin-${pluginName}`;
          const packagePath = `packages/plugin-${pluginName}`;

          return `This will create ${packageIdentifier} in ${packagePath}. Continue?`;
        },
        default: true,
      },
    ],
    actions: [
      {
        skip: (data: { confirm: boolean }) => {
          if (!data.confirm) {
            return "Plugin creation cancelled.";
          }
        },
        type: "addMany",
        base: "templates/shared/boilerplate",
        destination: "packages/plugin-{{kebabCase pluginName}}",
        templateFiles: "templates/shared/boilerplate/**",
        data: {
          packageType: "plugin",
        },
      },
      {
        skip: (data: { confirm: boolean }) => {
          if (!data.confirm) {
            return "Plugin creation cancelled.";
          }
        },
        type: "addMany",
        base: "templates/plugin",
        destination: "packages/plugin-{{kebabCase pluginName}}",
        templateFiles: "templates/plugin/**",
      },
      {
        path: require.resolve("../../../packages/core/util-graphql-schema/lib/index.ts"),
        pattern: /(\/\/ {{resolver-imports}})/g,
        template:
          "import { {{pascalCase pluginName}}Resolver } from '@repo/plugin-{{kebabCase pluginName}}/resolver';\n$1",
        type: "modify",
      },
      {
        path: require.resolve("../../../packages/core/util-graphql-schema/lib/index.ts"),
        pattern: /(\/\/ {{schema-resolvers}})/g,
        template: "{{pascalCase pluginName}}Resolver,\n$1",
        type: "modify",
      },
      (answers) => {
        const pluginName = plop.getHelper("kebabCase")(
          (answers as PluginAnswers).pluginName,
        );

        return installDependenciesToPackage(
          "@repo/core-util-graphql-schema",
          "dependencies",
          {
            [`@repo/plugin-${pluginName}`]: "workspace:^",
          },
        );
      },
      (answers) => {
        const pluginName = plop.getHelper("kebabCase")(
          (answers as PluginAnswers).pluginName,
        );

        return formatOutputCode(`packages/plugin-${pluginName}`);
      },
    ],
  });
