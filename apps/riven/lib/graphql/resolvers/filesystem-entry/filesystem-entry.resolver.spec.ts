import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type { Principal } from "#graphql/auth/principal.ts";
import type {
  FileSystemEntryResolverSpecGetFileSizeQuery,
  FileSystemEntryResolverSpecGetFileSizeQueryVariables,
} from "./filesystem-entry.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_FILE_SIZE: TypedDocumentNode<
  FileSystemEntryResolverSpecGetFileSizeQuery,
  FileSystemEntryResolverSpecGetFileSizeQueryVariables
> = gql`
  query FileSystemEntryResolverSpecGetFileSize(
    $id: ID!
    $units: FileSizeUnit
    $precision: Int
  ) {
    mediaItemById(id: $id) {
      ... on Movie {
        mediaEntries {
          fileSize(units: $units, precision: $precision) {
            size
            units
          }
        }
      }
    }
  }
`;

const service: Principal = Object.freeze({ kind: "service" });

const it = baseIt.extend(
  "movieId",
  async ({ completedMovieContext: { completedMovie }, em }) => {
    // 1,234,567,890 bytes is 1,205,632.71 KiB, 1,177.38 MiB and 1.15 GiB
    await em.nativeUpdate(
      MediaEntry,
      { mediaItem: completedMovie.id },
      { fileSize: 1_234_567_890 },
    );

    return completedMovie.id;
  },
);

it.for([
  { units: undefined, expected: { size: 1_234_567_890, units: "B" } },
  { units: "byte", expected: { size: 1_234_567_890, units: "B" } },
  { units: "kilobyte", expected: { size: 1_205_632.71, units: "KiB" } },
  { units: "megabyte", expected: { size: 1177.38, units: "MiB" } },
  { units: "gigabyte", expected: { size: 1.15, units: "GiB" } },
] as const)(
  "resolves the file size in $units",
  async ({ units, expected }, { gqlExecuteAs, movieId }) => {
    await expect(
      gqlExecuteAs(service, GET_FILE_SIZE, {
        id: movieId,
        ...(units && { units }),
      }),
    ).resolves.toStrictEqual({
      data: {
        mediaItemById: {
          mediaEntries: [{ fileSize: expected }],
        },
      },
      errors: [],
    });
  },
);

it.for([
  { precision: 0, size: 1 },
  { precision: 5, size: 1.14978 },
])(
  "rounds the file size to $precision decimal places",
  async ({ precision, size }, { gqlExecuteAs, movieId }) => {
    const { data } = await gqlExecuteAs(service, GET_FILE_SIZE, {
      id: movieId,
      units: "gigabyte",
      precision,
    });

    expect(data?.mediaItemById).toMatchObject({
      mediaEntries: [{ fileSize: { size, units: "GiB" } }],
    });
  },
);

it.for([-1, 6])(
  "rejects a precision of %i",
  async (precision, { gqlExecuteAs, movieId }) => {
    const { errors } = await gqlExecuteAs(service, GET_FILE_SIZE, {
      id: movieId,
      units: "gigabyte",
      precision,
    });

    expect(errors).toStrictEqual([
      expect.objectContaining({
        path: "mediaItemById.mediaEntries.0.fileSize",
      }),
    ]);
  },
);
