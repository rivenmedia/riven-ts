import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

import { ObjectType } from "type-graphql";

import type { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";
import type { Duration } from "@repo/util-plugin-sdk/helpers/dates";

@ObjectType({ implements: IndexerData })
export class TvdbIndexerData implements Omit<IndexerData, "runtime" | "year"> {
  public id!: string;

  public title!: string;

  public overview!: string;

  public posterUrl?: string | null;

  public language?: string | null;

  public releaseDate?: Date | null;

  public genres!: Genre[];

  public type!: Extract<MediaItemType, "show">;

  public rawRuntime?: Duration | null;

  public status!: IndexerDataStatus;

  public originCountry?: string[] | null;
}
