import { type } from "arktype";

const TorznabItem = type({
  title: "string > 0",
  attr: type({
    "@attributes": {
      name: "string",
      value: "string",
    },
  }).array(),
});

export const TorznabResponse = type({
  channel: {
    items: TorznabItem.array().default(() => []),
  },
});
