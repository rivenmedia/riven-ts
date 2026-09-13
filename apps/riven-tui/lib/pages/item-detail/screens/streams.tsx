import { useSuspenseQuery } from "@apollo/client/react";
import { UnorderedList } from "@inkjs/ui";
import { Box, Text } from "ink";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_STREAMS } from "../queries/get-media-item-streams.query.ts";

export function ItemDetailStreamsScreen() {
  const itemId = useItemId();

  const { data, refetch } = useSuspenseQuery(GET_MEDIA_ITEM_STREAMS, {
    variables: {
      mediaItemId: itemId,
    },
  });

  useRefetch(refetch);

  if (data.mediaItemById.streams.length === 0) {
    return <Text dimColor>No streams found</Text>;
  }

  return (
    <UnorderedList>
      {data.mediaItemById.streams.map((stream) => (
        <UnorderedList.Item key={stream.infoHash}>
          <>
            <Box>
              <Text>{stream.infoHash}</Text>
            </Box>
            <Box paddingLeft={1}>
              <Text dimColor>{JSON.stringify(stream.parsedData)}</Text>
            </Box>
          </>
        </UnorderedList.Item>
      ))}
    </UnorderedList>
  );
}
