import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { type TypedDocumentNode, gql } from "@apollo/client";
import { UnrecoverableError } from "bullmq";

import { client } from "../../../graphql/apollo-client.ts";
import { downloadItemProcessorSchema } from "./download-item.schema.ts";

import type {
  DownloadMediaItemMutation,
  DownloadMediaItemMutationVariables,
  GetDownloadMediaItemInfoQuery,
} from "./download-item.processor.typegen.ts";

export const incompleteChildStates = MediaItemState.extract([
  "indexed",
  "scraped",
]);

const DOWNLOAD_MEDIA_ITEM_MUTATION: TypedDocumentNode<
  DownloadMediaItemMutation,
  DownloadMediaItemMutationVariables
> = gql`
  mutation DownloadMediaItem($input: DownloadMediaItemMutationInput!) {
    downloadMediaItem(input: $input) {
      success
      item {
        ... on Node {
          id
        }
      }
    }
  }
`;

const GET_DOWNLOAD_MEDIA_ITEM_INFO_QUERY: TypedDocumentNode<GetDownloadMediaItemInfoQuery> = gql`
  query GetDownloadMediaItemInfo($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        fullTitle
      }
    }
  }
`;

export const downloadItemProcessor = downloadItemProcessorSchema.implementAsync(
  async function ({ job }) {
    const [finalResult] = Object.values(await job.getChildrenValues());

    const { data: getItemData } = await client.query({
      query: GET_DOWNLOAD_MEDIA_ITEM_INFO_QUERY,
      variables: {
        id: job.data.id,
      },
    });

    if (!getItemData?.mediaItemById) {
      throw new Error("Failed to fetch media item info for download processor");
    }

    const itemTitle = getItemData.mediaItemById.fullTitle;

    if (!finalResult) {
      throw new UnrecoverableError(
        "No valid torrent found after trying all downloaders",
      );

      // sendEvent({
      //   type: "riven.media-item.download.error",
      //   item,
      //   error,
      // });

      // throw error;
    }

    const { data: downloadItemData } = await client.mutate({
      mutation: DOWNLOAD_MEDIA_ITEM_MUTATION,
      variables: {
        input: {
          id: job.data.id,
          torrent: finalResult.result,
          processedBy: finalResult.plugin,
        },
      },
    });

    if (!downloadItemData?.downloadMediaItem.success) {
      throw new Error(`Failed to process download results for ${itemTitle}`);
    }
  },
);
