import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text } from "ink";
import Link from "ink-link";
import Image from "ink-picture";
import { useNavigate, useParams } from "react-router";
import z from "zod";

import { useActionsMenuContext } from "../../../ui/actions-menu/actions-menu-context.tsx";
import { SelectList } from "../../../ui/select-list.tsx";
import { SelectableRow } from "../../../ui/selectable-row.tsx";
import { StateBadge } from "../../../ui/state-badge.tsx";
import { DetailRow } from "../components/detail-row.tsx";
import { GET_MEDIA_ITEM_OVERVIEW } from "../queries/get-media-item-overview.query.ts";
import { formatDate } from "../utilities/format-date.ts";
import { formatList } from "../utilities/format-list.ts";
import { getChildren } from "../utilities/get-children.ts";
import { getContentRating } from "../utilities/get-content-rating.ts";

export function ItemDetailOverviewTab() {
  const params = useParams<"id">();
  const id = z.string().parse(params.id);
  const navigate = useNavigate();
  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  const {
    data: { mediaItemById: item },
  } = useSuspenseQuery(GET_MEDIA_ITEM_OVERVIEW, {
    fetchPolicy: "network-only",
    variables: { mediaItemId: id },
  });

  const childItems = getChildren(item);
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
        <DetailRow label="Release date" value={formatDate(item.releaseDate)} />
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
        <DetailRow label="Scraped at" value={formatDate(item.scrapedAt)} />
        <DetailRow label="Indexed at" value={formatDate(item.indexedAt)} />
      </Box>
      {childItems.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>
            {item.__typename === "Show" ? "Seasons" : "Episodes"}
          </Text>
          <SelectList
            items={childItems}
            getKey={(child) => child.id}
            onSelect={(child) => {
              void navigate(`/item/${child.id}`);
            }}
            isActive={!isActionsMenuVisible}
            renderItem={(child, isSelected) => (
              <SelectableRow isSelected={isSelected}>
                {child.type === "Season"
                  ? `Season ${child.number.toString()}`
                  : `Episode ${child.number.toString()}`}{" "}
                — {child.title} <StateBadge state={child.state} />
              </SelectableRow>
            )}
          />
        </Box>
      )}
    </Box>
  );
}
