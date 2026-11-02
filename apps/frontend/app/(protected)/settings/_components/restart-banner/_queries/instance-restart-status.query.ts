import { gql } from "@apollo/client";

import type {
  InstanceRestartStatusQuery,
  InstanceRestartStatusQueryVariables,
} from "./instance-restart-status.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const INSTANCE_RESTART_STATUS: TypedDocumentNode<
  InstanceRestartStatusQuery,
  InstanceRestartStatusQueryVariables
> = gql`
  query InstanceRestartStatus {
    instanceStatus {
      restartRequired
    }
  }
`;
