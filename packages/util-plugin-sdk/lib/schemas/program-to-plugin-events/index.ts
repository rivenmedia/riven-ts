import z from "zod";

import { CoreStartedEvent } from "./core/started.ts";
import { MediaItemCreationAlreadyExistsEvent } from "./media-item/creation/already-exists.ts";
import { MediaItemCreationErrorEvent } from "./media-item/creation/error.ts";
import { MediaItemCreationSuccessEvent } from "./media-item/creation/success.ts";

export const ProgramToPluginEvent = z.discriminatedUnion("type", [
  CoreStartedEvent,
  MediaItemCreationSuccessEvent,
  MediaItemCreationAlreadyExistsEvent,
  MediaItemCreationErrorEvent,
]);

export type ProgramToPluginEvent = z.infer<typeof ProgramToPluginEvent>;
