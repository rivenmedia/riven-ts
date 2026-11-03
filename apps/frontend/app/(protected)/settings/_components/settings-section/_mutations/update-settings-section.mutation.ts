import { gql } from "@apollo/client";

import type {
  UpdateSettingsSectionMutation,
  UpdateSettingsSectionMutationVariables,
} from "./update-settings-section.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const UPDATE_SETTINGS_SECTION: TypedDocumentNode<
  UpdateSettingsSectionMutation,
  UpdateSettingsSectionMutationVariables
> = gql`
  mutation UpdateSettingsSection(
    $id: ID!
    $values: JSONObject!
    $reset: [String!]!
  ) {
    updateSettingsSection(id: $id, values: $values, reset: $reset) {
      success
      issues {
        path
        message
      }
    }
  }
`;
