import { gql } from "@apollo/client";

import type {
  ResetSettingsFieldsMutation,
  ResetSettingsFieldsMutationVariables,
} from "./reset-settings-fields.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RESET_SETTINGS_FIELDS: TypedDocumentNode<
  ResetSettingsFieldsMutation,
  ResetSettingsFieldsMutationVariables
> = gql`
  mutation ResetSettingsFields($id: ID!, $paths: [String!]!) {
    resetSettingsFields(id: $id, paths: $paths) {
      success
      issues {
        path
        message
      }
    }
  }
`;
