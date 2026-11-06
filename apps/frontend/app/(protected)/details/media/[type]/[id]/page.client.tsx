import { SingleMediaItem } from "../../_components/single-media-item.tsx";
import { ItemCast } from "./_components/item-cast/item-cast.tsx";
import { ItemMetadata } from "./_components/item-metadata.tsx";
import { ItemRecommendations } from "./_components/item-recommendations/item-recommendations.tsx";
import { ItemSeasons } from "./_components/item-seasons/item-seasons.tsx";
import { SimilarItems } from "./_components/similar-items/similar-items.tsx";

import type { ComponentProps } from "react";

interface MediaDetailsPageProps {
  data: ComponentProps<typeof SingleMediaItem>["indexerData"];
}

/**
 * Movie/show details route with request actions, metadata, seasons, cast,
 * recommendations and similar items.
 */
export function MediaDetailsPage({ data }: MediaDetailsPageProps) {
  return (
    <SingleMediaItem
      indexerData={data}
      slots={{
        seasonList: data.type === "show" && <ItemSeasons id={data.id} />,
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
