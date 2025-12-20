import { installDependenciesAction } from "./actions/install-dependencies";
import { formatOutputCodeAction } from "./actions/format-output";
import type { PlopTypes } from "@turbo/gen";

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
      installDependenciesAction,
      (answers) => {
        const pluginName = plop.getHelper("kebabCase")(
          (answers as PluginAnswers).pluginName,
        );

        return formatOutputCodeAction(`packages/plugin-${pluginName}`);
      },
    ],
  });
