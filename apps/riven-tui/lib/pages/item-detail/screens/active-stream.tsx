import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text } from "ink";
import SyntaxHighlight from "ink-syntax-highlight";
import stringify from "json-stringify-pretty-compact";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { DetailRow } from "../components/detail-row.tsx";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_ACTIVE_STREAM } from "../queries/get-media-item-active-stream.query.ts";

export function ItemDetailActiveStreamScreen() {
  const itemId = useItemId();

  const { data, refetch } = useSuspenseQuery(GET_MEDIA_ITEM_ACTIVE_STREAM, {
    variables: {
      mediaItemId: itemId,
    },
  });

  useRefetch(refetch);

  if (!data.mediaItemById.activeStream) {
    return <Text dimColor>No active stream found</Text>;
  }

  return (
    <Box flexDirection="column" gap={1}>
      <DetailRow
        label="Info hash"
        value={data.mediaItemById.activeStream.infoHash}
        flexDirection="column"
      />
      <DetailRow
        label="Parsed data"
        value={
          <SyntaxHighlight
            code={stringify(data.mediaItemById.activeStream.parsedData)}
          />
        }
        flexDirection="column"
      />
    </Box>
  );
}
