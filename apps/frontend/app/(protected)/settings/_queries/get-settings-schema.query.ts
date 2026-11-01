import { gql } from "@apollo/client";

import type {
  GetSettingsSchemaQuery,
  GetSettingsSchemaQueryVariables,
} from "./get-settings-schema.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_SETTINGS_SCHEMA: TypedDocumentNode<
  GetSettingsSchemaQuery,
  GetSettingsSchemaQueryVariables
> = gql`
  query GetSettingsSchema {
    settingsSchema
  }
`;
