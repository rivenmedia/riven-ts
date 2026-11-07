import { gql } from "@apollo/client";

import type {
  SetPluginEnabledMutation,
  SetPluginEnabledMutationVariables,
} from "./set-plugin-enabled.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const SET_PLUGIN_ENABLED: TypedDocumentNode<
  SetPluginEnabledMutation,
  SetPluginEnabledMutationVariables
> = gql`
  mutation SetPluginEnabled($id: ID!, $enabled: Boolean!) {
    setPluginEnabled(id: $id, enabled: $enabled) {
      success
      issues {
        path
        message
      }
    }
  }
`;
