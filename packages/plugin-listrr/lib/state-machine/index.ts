import { ListrrAPI } from "../datasource/listrr.datasource.ts";
import { logger } from "@repo/core-util-logger";
import type {
  PublishableProgramEvent,
  RequestedItem,
  SubscribableProgramEvent,
} from "@repo/util-plugin-sdk";
import {
  enqueueActions,
  fromPromise,
  setup,
  type ActorRef,
  type Snapshot,
} from "xstate";

type ParentActor = ActorRef<
  Snapshot<unknown>,
  Extract<PublishableProgramEvent, { type: "media:requested" }>
>;

export const listrrMachine = setup({
  types: {
    context: {} as {
      api: ListrrAPI;
      parentRef: ParentActor;
    },
    events: {} as { type: SubscribableProgramEvent },
    input: {} as {
      parentRef: ParentActor;
      cache: unknown;
    },
    children: {} as {
      fetchShows: "fetchShows";
    },
  },
  actors: {
    fetchShows: fromPromise<
      RequestedItem[],
      { contentLists: Set<string>; api: ListrrAPI }
    >(async ({ input }) => {
      return input.api.getShows(input.contentLists);
    }),
  },
}).createMachine({
  id: "Listrr",
  initial: "Idle",
  context: ({ input: { parentRef, cache } }) => ({
    parentRef,
    api: new ListrrAPI({
      cache,
      token: "f7f5a6871a944fb692d144eab2fde171722b5a79c5af4ac1a3f4fd225f94c3ba",
    }),
  }),
  on: {
    "riven.running": ".Processing",
  },
  states: {
    Idle: {},
    Processing: {
      entry() {
        logger.info("Listrr machine is processing.");
      },
      invoke: {
        id: "fetchShows",
        src: "fetchShows",
        input: ({ context }) => ({
          contentLists: new Set(["6941fe52770814e293788237"]),
          api: context.api,
        }),
        onDone: {
          actions: enqueueActions(({ event, context, enqueue }) => {
            enqueue.sendTo(context.parentRef, {
              type: "media:requested",
              data: event.output,
            });
          }),
        },
      },
    },
  },
});
