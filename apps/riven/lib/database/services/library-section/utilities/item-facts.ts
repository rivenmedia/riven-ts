import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { UUID } from "node:crypto";

/** Stream metadata flattened out of `Stream.parsedData`, pre-normalised. */
export interface StreamFacts {
  resolution: string | null;
  quality: string | null;
  codec: string | null;
  hdr: string[];
  audio: string[];
  remux: boolean;
  group: string | null;
}

/**
 * Everything a rule can be evaluated against, flattened and normalised ahead of
 * time.
 *
 * Strings are lowercased, dates are epoch milliseconds, and provider format
 * differences between movies and shows are already folded away. Keeping this a
 * plain object with no entity references is what makes `evaluateRule` pure —
 * see the note on that function.
 */
export interface ItemFacts {
  id: UUID;
  /** Sections match whole items, so only the two top-level types appear here. */
  type: "movie" | "show";
  title: string | null;
  genres: string[];
  year: number | null;
  releaseDate: number | null;
  createdAt: number;
  language: string | null;
  country: string | null;
  network: string | null;
  contentRating: string | null;
  state: MediaItemState;
  isAnime: boolean;
  /** Minutes. Mean episode runtime for shows. */
  runtime: number | null;
  /** Bytes. Mean episode file size for shows. */
  fileSize: number | null;
  stream: StreamFacts | null;
}
