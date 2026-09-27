import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import Link from "ink-link";
import Image from "ink-picture";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { DetailRow } from "../../item-detail/components/detail-row.tsx";
import { REQUEST_ITEM } from "../queries/request-item.mutation.ts";
import { TMDB_SHOW_DETAILS } from "../queries/tmdb-show-details.query.ts";

const RESOLUTION_OPTIONS = ["2160p", "1080p", "720p"] as const;
const LANGUAGE_OPTIONS = ["en", "ja", "ko", "es", "fr", "de"] as const;

const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

const languageRowsStart = RESOLUTION_OPTIONS.length;
const seasonRowsStart = languageRowsStart + 1;

const locationStateSchema = z.object({
  result: z.object({
    id: z.number(),
    mediaType: z.enum(["movie", "show"]),
    title: z.string().nullish(),
    overview: z.string().nullish(),
    releaseDate: z.string().nullish(),
    posterPath: z.string().nullish(),
    originalLanguage: z.string().nullish(),
    voteAverage: z.number().nullish(),
  }),
});

function useShowDetails(result: { id: number } | null) {
  return useQuery(TMDB_SHOW_DETAILS, {
    variables: { id: result?.id ?? 0 },
    skip: result === null,
    fetchPolicy: "network-only",
  });
}

export function SearchResultDetailScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const client = useApolloClient();

  const parsedState = locationStateSchema.safeParse(location.state);

  const result = parsedState.success ? parsedState.data.result : null;

  const [selectedResolutions, setSelectedResolutions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSeasons, setSelectedSeasons] = useState<Set<number> | null>(
    null,
  );
  const [language, setLanguage] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isShow = result?.mediaType === "show";

  const { data: showDetailsData } = useShowDetails(isShow ? result : null);

  const numberOfSeasons = showDetailsData?.tmdbShowDetails.numberOfSeasons ?? 0;
  const seasonRowCount =
    isShow && numberOfSeasons > 0 ? numberOfSeasons + 1 : 0;
  const requestRowIndex = seasonRowsStart + seasonRowCount;
  const totalRows = requestRowIndex + 1;

  function toggleSeason(season: number) {
    setSelectedSeasons((current) => {
      if (current === null) {
        return new Set([season]);
      }

      const next = new Set(current);

      if (next.has(season)) {
        next.delete(season);
      } else {
        next.add(season);
      }

      return next.size === 0 ? null : next;
    });
  }

  function submitRequest() {
    if (result === null) {
      return;
    }

    const tvdbId =
      result.mediaType === "show"
        ? (showDetailsData?.tmdbShowDetails.tvdbId ?? null)
        : null;

    if (result.mediaType === "show" && tvdbId === null) {
      setMessage(
        "Request failed: this show is not known to TVDB, which is required to index shows.",
      );

      return;
    }

    if (selectedSeasons?.size === 0) {
      setMessage("Select at least one season.");

      return;
    }

    setIsRequesting(true);
    setMessage(null);

    const preferences = {
      ...(selectedResolutions.size > 0 && {
        resolutions: [...selectedResolutions],
      }),
      ...(language != null && { language }),
    };

    const seasonsToRequest =
      selectedSeasons == null || selectedSeasons.size === 0
        ? undefined
        : [...selectedSeasons].toSorted((a, b) => a - b);

    client
      .mutate({
        mutation: REQUEST_ITEM,
        variables: {
          input: {
            type: result.mediaType,
            tmdbId: result.id.toString(),
            ...(tvdbId !== null && { tvdbId }),
            ...(seasonsToRequest && { seasons: seasonsToRequest }),
            ...(Object.keys(preferences).length > 0 && { preferences }),
          },
        },
      })
      .then((response) => {
        if (response.data?.requestItem) {
          setMessage(
            `Requested ${result.title ?? result.mediaType}. It will appear in your library once indexed.`,
          );

          return;
        }

        setMessage("Request failed: unknown error.");
      })
      .catch((error: unknown) => {
        if (CombinedGraphQLErrors.is(error)) {
          const errorMessages = error.errors
            .map((graphQLError) => graphQLError.message)
            .join("; ");

          setMessage(`Request failed: ${errorMessages}`);

          return;
        }

        setMessage("Request failed: unknown error.");
      })
      .finally(() => {
        setIsRequesting(false);
      });
  }

  useInput((input, key) => {
    if (key.escape) {
      void navigate(-1);

      return;
    }

    if (result === null) {
      return;
    }

    if (key.upArrow || input.toLowerCase() === "k") {
      setCursor((current) => Math.max(0, current - 1));

      return;
    }

    if (key.downArrow || input.toLowerCase() === "j") {
      setCursor((current) => Math.min(totalRows - 1, current + 1));

      return;
    }

    if (!key.return && input !== " ") {
      return;
    }

    if (cursor < languageRowsStart) {
      const resolution = RESOLUTION_OPTIONS[cursor];

      if (resolution) {
        setSelectedResolutions((current) => {
          const next = new Set(current);

          if (next.has(resolution)) {
            next.delete(resolution);
          } else {
            next.add(resolution);
          }

          return next;
        });
      }

      return;
    }

    if (cursor === languageRowsStart) {
      const currentIndex = LANGUAGE_OPTIONS.indexOf(
        language as (typeof LANGUAGE_OPTIONS)[number],
      );
      const nextLanguage = LANGUAGE_OPTIONS[currentIndex + 1];

      setLanguage(nextLanguage ?? null);

      return;
    }

    if (seasonRowCount > 0 && cursor === seasonRowsStart) {
      setSelectedSeasons(null);

      return;
    }

    if (cursor < requestRowIndex) {
      toggleSeason(cursor - seasonRowsStart);

      return;
    }

    submitRequest();
  });

  if (result === null) {
    return (
      <Box flexDirection="column">
        <Text dimColor>No result selected.</Text>
      </Box>
    );
  }

  const languageIndex = LANGUAGE_OPTIONS.indexOf(
    language as (typeof LANGUAGE_OPTIONS)[number],
  );
  const languageLabel =
    languageIndex === -1 ? "any" : LANGUAGE_OPTIONS[languageIndex];

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        {result.posterPath && (
          <Image
            src={`${TMDB_IMAGE_URL}${result.posterPath}`}
            alt={`Poster for ${result.title ?? result.mediaType}`}
            height={20}
            width={40}
          />
        )}
        <Box flexDirection="column">
          <DetailRow
            label="TMDB"
            value={
              <Link
                url={`https://www.themoviedb.org/${result.mediaType}/${result.id.toString()}`}
              >
                <Text color="blue">{result.id.toString()}</Text>
              </Link>
            }
          />
          <DetailRow
            label="Release"
            value={result.releaseDate?.slice(0, 4) ?? "—"}
          />
          <DetailRow
            label="Rating"
            value={result.voteAverage?.toFixed(1) ?? "—"}
          />
          <DetailRow label="Language" value={result.originalLanguage ?? "—"} />
        </Box>
      </Box>
      {result.overview && <Text>{result.overview}</Text>}
      <Box flexDirection="column" paddingTop={1}>
        <Text dimColor>Download preferences</Text>
        {RESOLUTION_OPTIONS.map((resolution, index) => (
          <Text key={resolution} color={index === cursor ? "cyan" : "white"}>
            {index === cursor ? "❯ " : "  "}
            {resolution}
            {selectedResolutions.has(resolution) ? " ✓" : ""}
          </Text>
        ))}
        <Text color={languageRowsStart === cursor ? "cyan" : "white"}>
          {languageRowsStart === cursor ? "❯ " : "  "}
          Language: {languageLabel}
        </Text>
        {seasonRowCount > 0 && (
          <>
            <Text dimColor>Seasons</Text>
            <Text color={seasonRowsStart === cursor ? "cyan" : "white"}>
              {seasonRowsStart === cursor ? "❯ " : "  "}All seasons
              {selectedSeasons === null ? " ✓" : ""}
            </Text>
            {Array.from({ length: numberOfSeasons }, (_, index) => {
              const season = index + 1;
              const rowIndex = seasonRowsStart + 1 + index;

              return (
                <Text
                  key={season}
                  color={rowIndex === cursor ? "cyan" : "white"}
                >
                  {rowIndex === cursor ? "❯ " : "  "}
                  Season {season.toString()}
                  {selectedSeasons?.has(season) ? " ✓" : ""}
                </Text>
              );
            })}
          </>
        )}
        <Text color={requestRowIndex === cursor ? "cyan" : "white"}>
          {requestRowIndex === cursor ? "❯ " : "  "}
          Request
        </Text>
      </Box>
      {message && <Text color="yellow">{message}</Text>}
      {isRequesting && <Text dimColor>Requesting…</Text>}
    </Box>
  );
}
