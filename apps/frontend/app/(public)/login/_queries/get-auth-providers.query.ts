import { type TypedDocumentNode, gql } from "@apollo/client";

import type {
  GetAuthProvidersQuery,
  GetAuthProvidersQueryVariables,
} from "./get-auth-providers.query.typegen";

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
