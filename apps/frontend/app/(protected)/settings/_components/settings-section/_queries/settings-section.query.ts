import { gql } from "@apollo/client";

import type {
  SettingsSectionQuery,
  SettingsSectionQueryVariables,
} from "./settings-section.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const SETTINGS_SECTION: TypedDocumentNode<
  SettingsSectionQuery,
  SettingsSectionQueryVariables
> = gql`
  query SettingsSection($id: ID!) {
    settingsSection(id: $id) {
      id
      title
      jsonSchema
      values
      lockedFields
      secretStates {
        path
        state
      }
      issues {
        path
        message
      }
    }
  }
`;
