import { type } from "arktype";

export const DeleteTorrentResponse = type({
  data: {
    id: "string > 0",
  },
});

export type DeleteTorrentResponse = typeof DeleteTorrentResponse.infer;
