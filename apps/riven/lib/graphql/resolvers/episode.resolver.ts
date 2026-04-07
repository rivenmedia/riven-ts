import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Resolver, Root } from "type-graphql";

@Resolver((_of) => Episode)
export class EpisodeResolver {
  @FieldResolver(() => Season)
  season(@Root() episode: Episode) {
    return episode.season.loadOrFail();
  }
}
