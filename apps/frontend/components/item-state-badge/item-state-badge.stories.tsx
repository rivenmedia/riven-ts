import { HttpResponse } from "msw";
import { expect } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { ItemStateBadge } from "#components/item-state-badge/item-state-badge.tsx";
import { api } from "#mocks/graphql.ts";

import { GET_ITEM_STATE } from "./_queries/get-item-state.query.ts";
import { ON_MEDIA_ITEM_STATE_CHANGED } from "./_subscriptions/on-media-item-state-changed.subscription.ts";

const meta = preview.meta({
  title: "Components / ItemStateBadge",
  component: ItemStateBadge,
  args: {
    id: crypto.randomUUID(),
    large: true,
  },
  beforeEach({ msw }) {
    msw.use(
      api.query(GET_ITEM_STATE, () =>
        HttpResponse.json({
          data: {
            mediaItemById: {
              __typename: "Movie",
              isRequested: true,
              state: "scraped",
            },
          },
        }),
      ),
      api.subscription(ON_MEDIA_ITEM_STATE_CHANGED, () => {
        // The item's state doesn't change
      }),
    );
  },
});

export const Default = meta.story();

export const Unrequested = meta.story({
  beforeEach({ msw }) {
    msw.use(
      api.query(GET_ITEM_STATE, () =>
        HttpResponse.json({
          data: {
            mediaItemById: {
              __typename: "Movie",
              isRequested: false,
              state: "indexed",
            },
          },
        }),
      ),
    );
  },
});

export const StateChanged = meta.story({
  beforeEach({ args, msw }) {
    msw.use(
      api.subscription(ON_MEDIA_ITEM_STATE_CHANGED, ({ subscription }) => {
        if (subscription.variables.id !== args.id) {
          subscription.error([
            { message: `Invalid id parameter: ${subscription.variables.id}` },
          ]);

          return;
        }

        subscription.publish({
          data: {
            mediaItemStateChanged: {
              __typename: "Movie",
              state: "completed",
            },
          },
        });
      }),
    );
  },
});

StateChanged.test(
  "Shows the latest state from the subscription",
  async ({ canvas }) => {
    await expect(await canvas.findByText("Completed")).toBeInTheDocument();
  },
);
