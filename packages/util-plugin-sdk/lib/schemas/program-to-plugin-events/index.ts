import z from "zod";

import { CoreStartedEvent } from "./core/started.ts";
import { MediaItemCreationAlreadyExistsEvent } from "./media-item/creation/already-exists.ts";
import { MediaItemCreationErrorEvent } from "./media-item/creation/error.ts";
import { MediaItemCreationSuccessEvent } from "./media-item/creation/success.ts";
import { MediaItemIndexAlreadyExistsEvent } from "./media-item/index/already-exists.ts";
import { MediaItemIndexErrorEvent } from "./media-item/index/error.ts";
import { MediaItemIndexSuccessEvent } from "./media-item/index/success.ts";

export const ProgramToPluginEvent = z.discriminatedUnion("type", [
  CoreStartedEvent,
  MediaItemCreationSuccessEvent,
  MediaItemCreationAlreadyExistsEvent,
  MediaItemCreationErrorEvent,
  MediaItemIndexSuccessEvent,
  MediaItemIndexAlreadyExistsEvent,
  MediaItemIndexErrorEvent,
]);

export type ProgramToPluginEvent = z.infer<typeof ProgramToPluginEvent>;
