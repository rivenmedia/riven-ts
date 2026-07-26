import { gql } from "@apollo/client";

import type {
  GetAuthProvidersQuery,
  GetAuthProvidersQueryVariables,
} from "./get-auth-providers.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_AUTH_PROVIDERS: TypedDocumentNode<
  GetAuthProvidersQuery,
  GetAuthProvidersQueryVariables
> = gql`
  query GetAuthProviders {
    authProviders {
      key
      name
      enabled
      disableSignup
    }
  }
`;
