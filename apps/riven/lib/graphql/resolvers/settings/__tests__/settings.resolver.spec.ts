import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type {
  SettingsResolverSpecInstanceStatusQuery,
  SettingsResolverSpecInstanceStatusQueryVariables,
  SettingsResolverSpecSettingsSectionQuery,
  SettingsResolverSpecSettingsSectionQueryVariables,
  SettingsResolverSpecUpdateSettingsSectionMutation,
  SettingsResolverSpecUpdateSettingsSectionMutationVariables,
} from "./settings.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const TMDB_DEFAULT_API_KEY_FRAGMENT = "eyJhbGciOiJIUzI1NiJ9";

const SETTINGS_SECTION: TypedDocumentNode<
  SettingsResolverSpecSettingsSectionQuery,
  SettingsResolverSpecSettingsSectionQueryVariables
> = gql`
  query SettingsResolverSpecSettingsSection($id: ID!) {
    settingsSection(id: $id) {
      id
      title
      jsonSchema
      values
      lockedFields
      secretStates {
        path
        state
      }
      issues {
        path
        message
      }
    }
  }
`;

const UPDATE_SETTINGS_SECTION: TypedDocumentNode<
  SettingsResolverSpecUpdateSettingsSectionMutation,
  SettingsResolverSpecUpdateSettingsSectionMutationVariables
> = gql`
  mutation SettingsResolverSpecUpdateSettingsSection(
    $id: ID!
    $values: JSONObject!
    $reset: [String!]
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

const INSTANCE_STATUS: TypedDocumentNode<
  SettingsResolverSpecInstanceStatusQuery,
  SettingsResolverSpecInstanceStatusQueryVariables
> = gql`
  query SettingsResolverSpecInstanceStatus {
    instanceStatus {
      restartRequired
    }
  }
`;

it("returns the general section with its default values", async ({
  gqlContext,
  gqlServer,
}) => {
  const response = await gqlServer.executeOperation<
    SettingsResolverSpecSettingsSectionQuery,
    SettingsResolverSpecSettingsSectionQueryVariables
  >(
    { query: SETTINGS_SECTION, variables: { id: "general" } },
    { contextValue: gqlContext },
  );

  expect.assert(response.body.kind === "single");

  expect(response.body.singleResult.errors).toBeUndefined();
  expect(response.body.singleResult.data?.settingsSection).toMatchObject({
    id: "general",
    values: { scraping: { maximumFailedAttempts: 10 } },
  });
});

it("never exposes a secret default, only its state", async ({
  gqlContext,
  gqlServer,
}) => {
  const response = await gqlServer.executeOperation<
    SettingsResolverSpecSettingsSectionQuery,
    SettingsResolverSpecSettingsSectionQueryVariables
  >(
    { query: SETTINGS_SECTION, variables: { id: "repo-plugin-tmdb" } },
    { contextValue: gqlContext },
  );

  expect.assert(response.body.kind === "single");

  expect(response.body.singleResult.errors).toBeUndefined();
  expect(JSON.stringify(response.body.singleResult)).not.toContain(
    TMDB_DEFAULT_API_KEY_FRAGMENT,
  );
  expect(
    structuredClone(
      response.body.singleResult.data?.settingsSection.secretStates,
    ),
  ).toStrictEqual([{ path: "apiKey", state: "default" }]);
});

it("fails with NOT_FOUND for an unknown section", async ({
  gqlContext,
  gqlServer,
}) => {
  const response = await gqlServer.executeOperation<
    SettingsResolverSpecSettingsSectionQuery,
    SettingsResolverSpecSettingsSectionQueryVariables
  >(
    { query: SETTINGS_SECTION, variables: { id: "nope" } },
    { contextValue: gqlContext },
  );

  expect.assert(response.body.kind === "single");

  expect(response.body.singleResult.errors?.[0]?.extensions?.["code"]).toBe(
    "NOT_FOUND",
  );
});

it("reports issues for an invalid update", async ({
  gqlContext,
  gqlServer,
}) => {
  const response = await gqlServer.executeOperation<
    SettingsResolverSpecUpdateSettingsSectionMutation,
    SettingsResolverSpecUpdateSettingsSectionMutationVariables
  >(
    {
      query: UPDATE_SETTINGS_SECTION,
      variables: {
        id: "general",
        values: { scraping: { maximumFailedAttempts: "many" } },
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(response.body.kind === "single");

  expect(response.body.singleResult.errors).toBeUndefined();
  expect(response.body.singleResult.data?.updateSettingsSection).toMatchObject({
    success: false,
    issues: [{ path: "scraping.maximumFailedAttempts" }],
  });
});

it("flags a restart as required after a valid update", async ({
  gqlContext,
  gqlServer,
}) => {
  const before = await gqlServer.executeOperation<
    SettingsResolverSpecInstanceStatusQuery,
    SettingsResolverSpecInstanceStatusQueryVariables
  >({ query: INSTANCE_STATUS }, { contextValue: gqlContext });

  expect.assert(before.body.kind === "single");

  expect(before.body.singleResult.data?.instanceStatus.restartRequired).toBe(
    false,
  );

  const update = await gqlServer.executeOperation<
    SettingsResolverSpecUpdateSettingsSectionMutation,
    SettingsResolverSpecUpdateSettingsSectionMutationVariables
  >(
    {
      query: UPDATE_SETTINGS_SECTION,
      variables: {
        id: "general",
        values: { scraping: { maximumFailedAttempts: 5 } },
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(update.body.kind === "single");

  expect(update.body.singleResult.data?.updateSettingsSection).toMatchObject({
    success: true,
    issues: [],
  });

  const after = await gqlServer.executeOperation<
    SettingsResolverSpecInstanceStatusQuery,
    SettingsResolverSpecInstanceStatusQueryVariables
  >({ query: INSTANCE_STATUS }, { contextValue: gqlContext });

  expect.assert(after.body.kind === "single");

  expect(after.body.singleResult.data?.instanceStatus.restartRequired).toBe(
    true,
  );
});

it("resets the given fields whilst saving a section", async ({
  gqlContext,
  gqlServer,
  services,
}) => {
  await services.settingsService.writeValues("riven", {
    upsert: { maximumFailedAttempts: 5 },
    delete: [],
  });

  const update = await gqlServer.executeOperation<
    SettingsResolverSpecUpdateSettingsSectionMutation,
    SettingsResolverSpecUpdateSettingsSectionMutationVariables
  >(
    {
      query: UPDATE_SETTINGS_SECTION,
      variables: {
        id: "general",
        values: {},
        reset: ["scraping.maximumFailedAttempts"],
      },
    },
    { contextValue: gqlContext },
  );

  expect.assert(update.body.kind === "single");

  expect(update.body.singleResult.errors).toBeUndefined();
  expect(update.body.singleResult.data?.updateSettingsSection).toMatchObject({
    success: true,
    issues: [],
  });

  await expect(
    services.settingsService.getStoredValues("riven"),
  ).resolves.not.toHaveProperty("maximumFailedAttempts");
});
