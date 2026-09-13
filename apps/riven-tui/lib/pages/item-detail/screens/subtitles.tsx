import { useSuspenseQuery } from "@apollo/client/react";
import { UnorderedList } from "@inkjs/ui";
import { Text } from "ink";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_SUBTITLES } from "../queries/get-media-item-subtitles.query.ts";

export function ItemDetailSubtitlesScreen() {
  const { data, refetch } = useSuspenseQuery(GET_MEDIA_ITEM_SUBTITLES, {
    variables: {
      mediaItemId: useItemId(),
    },
  });

  useRefetch(refetch);

  if (data.mediaItemById.subtitles.length === 0) {
    return <Text dimColor>No subtitles found</Text>;
  }

  return (
    <UnorderedList>
      {data.mediaItemById.subtitles.map((entry) => (
        <UnorderedList.Item key={entry.fileHash}>
          <Text>
            {entry.language}{" "}
            <Text dimColor>
              ({entry.sourceProvider}
              {entry.sourceId ? `: ${entry.sourceId}` : ""})
            </Text>
          </Text>
        </UnorderedList.Item>
      ))}
    </UnorderedList>
  );
}
