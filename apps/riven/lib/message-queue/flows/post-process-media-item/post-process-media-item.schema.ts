import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const PostProcessMediaItemFlow = createFlowSchema(
  "post-process-media-item",
  {
    input: z.object({
      step: z.enum(["post-process", "validate-post-process", "complete"]),
      mediaItem: z.object({
        id: UUID,
        type: MediaItemType,
        fullTitle: z.string(),
      }),
    }),
  },
);

export type PostProcessMediaItemFlow = z.infer<typeof PostProcessMediaItemFlow>;

export const postProcessMediaItemProcessorSchema =
  PostProcessMediaItemFlow.shape.processor;

export const createPostProcessMediaItemJob = createFlowJobBuilder(
  PostProcessMediaItemFlow,
);
