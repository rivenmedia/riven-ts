import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text } from "ink";
import Link from "ink-link";
import Image from "ink-picture";
import { DateTime } from "luxon";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { useActionsMenuContext } from "../../../ui/actions-menu/actions-menu-context.tsx";
import { DetailRow } from "../components/detail-row.tsx";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_OVERVIEW } from "../queries/get-media-item-overview.query.ts";
import { formatDate } from "../utilities/format-date.ts";
import { formatList } from "../utilities/format-list.ts";
import { getContentRating } from "../utilities/get-content-rating.ts";

export function ItemDetailOverviewTab() {
  const id = useItemId();
  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  const {
    refetch,
    data: { mediaItemById: item },
  } = useSuspenseQuery(GET_MEDIA_ITEM_OVERVIEW, {
    fetchPolicy: "network-only",
    variables: { mediaItemId: id },
  });

  useRefetch(refetch, !isActionsMenuVisible);

  const contentRating = getContentRating(item);

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        {item.posterPath && (
          <Image
            src={item.posterPath}
            alt={`Poster for ${item.fullTitle}`}
            height={20}
            width={40}
          />
        )}
      </Box>
      <Box flexDirection="column">
        {item.__typename === "Movie" ? (
          <DetailRow
            label="TMDb ID"
            value={
              <Link url={`https://www.themoviedb.org/movie/${item.tmdbId}`}>
                <Text color="blue">{item.tmdbId}</Text>
              </Link>
            }
          />
        ) : (
          <DetailRow
            label="TVDB ID"
            value={
              <Link
                url={`https://www.thetvdb.com/dereferrer/series/${item.tvdbId}`}
              >
                <Text color="blue">{item.tvdbId}</Text>
              </Link>
            }
          />
        )}
        {item.imdbId && (
          <DetailRow
            label="IMDb ID"
            value={
              <Link url={`https://www.imdb.com/title/${item.imdbId}`}>
                <Text color="blue">{item.imdbId}</Text>
              </Link>
            }
          />
        )}
      </Box>
      <Box flexDirection="column">
        <DetailRow label="Year" value={item.year?.toString() ?? "—"} />
        <DetailRow label="Rating" value={item.rating?.toFixed(1) ?? "—"} />
        <DetailRow label="Content rating" value={contentRating ?? "—"} />
        <DetailRow
          label="Release date"
          value={formatDate(item.releaseDate, DateTime.DATE_SHORT)}
        />
        <DetailRow label="Genres" value={formatList(item.genres)} />
        {item.__typename === "Show" && item.status && (
          <DetailRow label="Status" value={item.status} />
        )}
        {item.__typename === "Movie" && (
          <DetailRow
            label="Runtime"
            value={item.runtime ? `${item.runtime.toString()} min` : "—"}
          />
        )}
        <DetailRow label="Streams" value={item.streams.length.toString()} />
        <DetailRow
          label="Blacklisted"
          value={item.blacklistedStreams.length.toString()}
        />
        <DetailRow
          label="Files"
          value={item.filesystemEntries.length.toString()}
        />
        <DetailRow label="Subtitles" value={item.subtitles.length.toString()} />
        <DetailRow label="Last scraped at" value={formatDate(item.scrapedAt)} />
        <DetailRow label="Indexed at" value={formatDate(item.indexedAt)} />
      </Box>
    </Box>
  );
}
