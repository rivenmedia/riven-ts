import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import { DateTime } from "luxon";

import { DetailRow } from "../components/detail-row.tsx";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_PROCESSING_DATA } from "../queries/get-media-item-processing-data.query.ts";
import { formatDate } from "../utilities/format-date.ts";

export function ItemDetailProcessingDataScreen() {
  const itemId = useItemId();

  const { data, refetch } = useSuspenseQuery(GET_MEDIA_ITEM_PROCESSING_DATA, {
    variables: {
      mediaItemId: itemId,
    },
  });

  useInput((input) => {
    if (input.toLowerCase() === "r") {
      void refetch();
    }
  });

  if (!data.mediaItemById.nextScrapeAttemptAt) {
    return <Text dimColor>No processor job data found</Text>;
  }

  return (
    <Box>
      {data.mediaItemById.nextScrapeAttemptAt && (
        <DetailRow
          label="Next scrape at"
          value={formatDate(
            data.mediaItemById.nextScrapeAttemptAt,
            DateTime.DATETIME_SHORT_WITH_SECONDS,
          )}
        />
      )}
    </Box>
  );
}
