import { gql } from "@apollo/client";

import type {
  GetInstanceSetupRequiredQuery,
  GetInstanceSetupRequiredQueryVariables,
} from "./get-instance-setup-required.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

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
