import { query } from "@/lib/graphql/client";

import { notFound } from "next/navigation";

import { GET_MEDIA_ITEM } from "./_queries/get-media-item.query";
import { MediaDetailsPage as MediaDetailsPageClient } from "./page.client";

export default async function MediaDetailsPage({
  params,
}: PageProps<"/details/media/[type]/[id]">) {
  const { id, type } = await params;
  console.log({ id, type });
  const { data } = await query({
    query: GET_MEDIA_ITEM,
    errorPolicy: "all",
    variables: {
      id,
    },
  });

  console.log(data);

  if (!data) {
    return notFound();
  }

  return <MediaDetailsPageClient data={data} />;
}
