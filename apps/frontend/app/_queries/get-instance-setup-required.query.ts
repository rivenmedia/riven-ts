import { type TypedDocumentNode, gql } from "@apollo/client";

import type {
  GetInstanceSetupRequiredQuery,
  GetInstanceSetupRequiredQueryVariables,
} from "./get-instance-setup-required.query.typegen";

export const GET_INSTANCE_SETUP_REQUIRED: TypedDocumentNode<
  GetInstanceSetupRequiredQuery,
  GetInstanceSetupRequiredQueryVariables
> = gql`
  query GetInstanceSetupRequired {
    instanceStatus {
      setupRequired
    }
  }
`;
