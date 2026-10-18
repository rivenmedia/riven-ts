import { SingleMediaItem } from "../../_components/single-media-item.tsx";
import { ItemCast } from "./_components/item-cast/item-cast.tsx";
import { ItemMetadata } from "./_components/item-metadata.tsx";
import { ItemRecommendations } from "./_components/item-recommendations/item-recommendations.tsx";
import { SimilarItems } from "./_components/similar-items/similar-items.tsx";

import type { IndexerData } from "#app/_types/__generated__/graphql.ts";

interface MediaDetailsPageProps {
  data: IndexerData;
}

export function MediaDetailsPage({ data }: MediaDetailsPageProps) {
  return (
    <SingleMediaItem
      indexerData={data}
      slots={{
        castList: <ItemCast id={data.id} type={data.type} />,
        itemMetadata: <ItemMetadata data={data} />,
        itemRecommendations: (
          <ItemRecommendations id={data.id} type={data.type} />
        ),
        similarItems: <SimilarItems id={data.id} type={data.type} />,
      }}
    />
  );
}
