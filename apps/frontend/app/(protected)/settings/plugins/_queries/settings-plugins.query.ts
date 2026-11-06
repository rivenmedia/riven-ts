import { gql } from "@apollo/client";

import type {
  SettingsPluginsQuery,
  SettingsPluginsQueryVariables,
} from "./settings-plugins.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const SETTINGS_PLUGINS: TypedDocumentNode<
  SettingsPluginsQuery,
  SettingsPluginsQueryVariables
> = gql`
  query SettingsPlugins {
    settingsPlugins {
      plugins {
        id
        title
        enabled
        alwaysEnabled
      }
      enabledPluginsLocked
    }
  }
`;
