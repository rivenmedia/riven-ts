import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  RankingProfileResolverSpecCreateMutation,
  RankingProfileResolverSpecCreateMutationVariables,
  RankingProfileResolverSpecDeleteMutation,
  RankingProfileResolverSpecDeleteMutationVariables,
  RankingProfileResolverSpecInstanceStatusQuery,
  RankingProfileResolverSpecInstanceStatusQueryVariables,
  RankingProfileResolverSpecListQuery,
  RankingProfileResolverSpecListQueryVariables,
  RankingProfileResolverSpecSelectMutation,
  RankingProfileResolverSpecSelectMutationVariables,
} from "./ranking-profile.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const LIST: TypedDocumentNode<
  RankingProfileResolverSpecListQuery,
  RankingProfileResolverSpecListQueryVariables
> = gql`
  query RankingProfileResolverSpecList {
    rankingProfiles {
      id
      slug
      name
      description
      builtIn
      isActive
      rankingModel
      settings
      values
    }
    rankingProfileSchema
  }
`;

const CREATE: TypedDocumentNode<
  RankingProfileResolverSpecCreateMutation,
  RankingProfileResolverSpecCreateMutationVariables
> = gql`
  mutation RankingProfileResolverSpecCreate($values: JSONObject!) {
    createRankingProfile(values: $values) {
      success
      issues {
        path
        message
      }
    }
  }
`;

const SELECT: TypedDocumentNode<
  RankingProfileResolverSpecSelectMutation,
  RankingProfileResolverSpecSelectMutationVariables
> = gql`
  mutation RankingProfileResolverSpecSelect($id: ID!) {
    selectRankingProfile(id: $id) {
      success
      issues {
        path
        message
      }
    }
  }
`;

const DELETE: TypedDocumentNode<
  RankingProfileResolverSpecDeleteMutation,
  RankingProfileResolverSpecDeleteMutationVariables
> = gql`
  mutation RankingProfileResolverSpecDelete($id: ID!) {
    deleteRankingProfile(id: $id) {
      success
      issues {
        path
        message
      }
    }
  }
`;

const INSTANCE_STATUS: TypedDocumentNode<
  RankingProfileResolverSpecInstanceStatusQuery,
  RankingProfileResolverSpecInstanceStatusQueryVariables
> = gql`
  query RankingProfileResolverSpecInstanceStatus {
    instanceStatus {
      restartRequired
    }
  }
`;

const it = baseIt.extend(
  "run",
  ({ gqlContext, gqlServer }) =>
    async <TData, TVars extends Record<string, unknown>>(
      query: TypedDocumentNode<TData, TVars>,
      variables: TVars,
    ) => {
      const response = await gqlServer.executeOperation<TData, TVars>(
        { query, variables },
        { contextValue: gqlContext },
      );

      expect.assert(response.body.kind === "single");
      expect(response.body.singleResult.errors).toBeUndefined();
      expect.assert(response.body.singleResult.data);

      return response.body.singleResult.data;
    },
);

it("lists the default preset as active on a fresh instance", async ({
  run,
}) => {
  const data = await run(LIST, {});

  expect(data.rankingProfiles).toMatchObject([
    { slug: "default", builtIn: true, isActive: true },
  ]);
  expect(data.rankingProfileSchema).toBeTypeOf("object");
});

it("creates, selects and then refuses to delete the active profile", async ({
  run,
}) => {
  const { rankingProfiles: presets } = await run(LIST, {});
  const [preset] = presets;

  expect.assert(preset);

  const created = await run(CREATE, {
    values: { ...preset.values, name: "Custom" },
  });

  expect(created.createRankingProfile.success).toBe(true);
  expect(created.createRankingProfile.issues).toHaveLength(0);

  const { rankingProfiles } = await run(LIST, {});
  const custom = rankingProfiles.find((profile) => profile.name === "Custom");

  expect.assert(custom);

  const selected = await run(SELECT, { id: custom.id });

  expect(selected.selectRankingProfile.success).toBe(true);

  const deleted = await run(DELETE, { id: custom.id });

  expect(deleted.deleteRankingProfile.success).toBe(false);
  expect(deleted.deleteRankingProfile.issues).toHaveLength(1);
});

it("returns issues instead of throwing for invalid values", async ({ run }) => {
  const { rankingProfiles } = await run(LIST, {});
  const [preset] = rankingProfiles;

  expect.assert(preset);

  const { createRankingProfile: result } = await run(CREATE, {
    values: { ...preset.values, name: "" },
  });

  expect(result.success).toBe(false);
  expect(result.issues).toMatchObject([{ path: "name" }]);
});

it("does not set restartRequired after selecting a profile", async ({
  run,
}) => {
  const { rankingProfiles } = await run(LIST, {});
  const [profile] = rankingProfiles;

  expect.assert(profile);

  await run(SELECT, { id: profile.id });

  const { instanceStatus } = await run(INSTANCE_STATUS, {});

  expect(instanceStatus.restartRequired).toBe(false);
});
