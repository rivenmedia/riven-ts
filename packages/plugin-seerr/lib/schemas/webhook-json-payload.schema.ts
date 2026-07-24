import z from "zod";

export const WebhookJsonPayload = z.object({
  query: z.literal(
    "mutation ($input: SeerrHandleWebhookInput!) { seerrHandleWebhook(input: $input) }",
  ),
  variables: z.object({
    input: z.object({
      payload: z.object({
        notification_type: z.literal("{{notification_type}}"),
        "{{media}}": z.object({
          media_type: z.literal("{{media_type}}"),
          imdbId: z.literal("{{media_imdbid}}"),
          tmdbId: z.literal("{{media_tmdbid}}"),
          tvdbId: z.literal("{{media_tvdbid}}"),
        }),
        "{{request}}": z.object({
          request_id: z.literal("{{request_id}}"),
          requestedBy_email: z.literal("{{requestedBy_email}}"),
        }),
        "{{extra}}": z.tuple([]),
      }),
    }),
  }),
});

export type WebhookJsonPayload = z.infer<typeof WebhookJsonPayload>;
