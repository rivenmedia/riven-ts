import { HttpResponse } from "msw";

import { GET_AUTH_PROVIDERS } from "#app/(public)/login/_queries/get-auth-providers.query.ts";
import { api } from "#mocks/graphql.ts";

import type { GetAuthProvidersQuery } from "#app/(public)/login/_queries/get-auth-providers.query.typegen.ts";

type AuthProvider = GetAuthProvidersQuery["authProviders"][number];

export const credentialAuthProvider = {
  __typename: "AuthProvider",
  disableSignup: false,
  enabled: true,
  key: "credential",
  name: "Email and Password",
} as const satisfies AuthProvider;

export const createAuthProvidersHandler = (
  authProviders: AuthProvider[] = [credentialAuthProvider],
) =>
  api.query(GET_AUTH_PROVIDERS, () =>
    HttpResponse.json({ data: { authProviders } }),
  );
