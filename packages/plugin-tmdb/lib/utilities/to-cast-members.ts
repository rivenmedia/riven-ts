import { formatImageUrl } from "./format-image-url.ts";

import type { EpisodeCredits } from "../schemas/episode-credits.schema.ts";
import type { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";

/**
 * Maps an episode's main cast, followed by its guest stars, to cast members.
 *
 * @returns The cast members, or `null` if there are none
 */
export function episodeCreditsToCastMembers({
  cast,
  guest_stars: guestStars,
}: EpisodeCredits): CastMember[] | null {
  const castMembers = new Map<string, CastMember>();
  const uniqueCastMembers = [
    ...cast.toSorted((a, b) => a.order - b.order),
    ...guestStars.toSorted((a, b) => a.order - b.order),
  ];

  for (const member of uniqueCastMembers) {
    const id = member.id.toString();

    if (!castMembers.has(id)) {
      castMembers.set(id, {
        id,
        name: member.name,
        character: member.character,
        profileUrl: formatImageUrl(member.profile_path, "profile", "w185"),
      });
    }
  }

  return castMembers.size > 0 ? [...castMembers.values()] : null;
}
