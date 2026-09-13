import { useSuspenseQuery } from "@apollo/client/react";
import { UnorderedList } from "@inkjs/ui";
import { Box, Text } from "ink";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_FILES } from "../queries/get-media-item-files.query.ts";

export function ItemDetailFilesScreen() {
  const itemId = useItemId();

  const { data, refetch } = useSuspenseQuery(GET_MEDIA_ITEM_FILES, {
    variables: {
      mediaItemId: itemId,
    },
  });

  useRefetch(refetch);

  if (data.mediaItemById.mediaEntries.length === 0) {
    return <Text dimColor>No media entries found</Text>;
  }

  return (
    <UnorderedList>
      {data.mediaItemById.mediaEntries.map((entry) => (
        <UnorderedList.Item key={entry.id}>
          <>
            <Box>
              <Text>
                {entry.originalFilename}{" "}
                <Text dimColor>
                  ({entry.fileSize.size} {entry.fileSize.units})
                </Text>
              </Text>
            </Box>
            <Box paddingLeft={1}>
              <Text dimColor>
                Matched by {entry.plugin} via {entry.provider}
              </Text>
            </Box>
          </>
        </UnorderedList.Item>
      ))}
    </UnorderedList>
  );
}
