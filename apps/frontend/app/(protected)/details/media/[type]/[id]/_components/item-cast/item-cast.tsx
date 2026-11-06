import { cacheLife } from "next/cache";

import { CastSection } from "#app/(protected)/details/media/_components/cast-section.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_CAST } from "./_queries/get-item-cast.query";

import type { TopLevelMediaItemType } from "#app/_types/__generated__/graphql.ts";

async function fetchItemCast(
  id: string,
  type: TopLevelMediaItemType,
  locale: string,
) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_ITEM_CAST,
    variables: {
      id,
      type,
      language: locale,
    },
  });

  return data?.tmdbItem.cast ?? null;
}

interface ItemCastProps {
  id: string;
  type: TopLevelMediaItemType;
}

export function ItemCast({ id, type }: ItemCastProps) {
  return (
    <CastSection
      className="delay-550"
      fetchCast={async (locale) => fetchItemCast(id, type, locale)}
    />
  );
}
