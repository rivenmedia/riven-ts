import z from "zod";

const TestNotification = z.object({
  notification_type: z.literal("TEST_NOTIFICATION"),
});

const WebhookNotification = z
  .object({
    notification_type: z.enum([
      "NONE",
      "MEDIA_PENDING",
      "MEDIA_APPROVED",
      "MEDIA_AVAILABLE",
      "MEDIA_FAILED",
      "MEDIA_DECLINED",
      "MEDIA_AUTO_APPROVED",
      "ISSUE_CREATED",
      "ISSUE_COMMENT",
      "ISSUE_RESOLVED",
      "ISSUE_REOPENED",
      "MEDIA_AUTO_REQUESTED",
    ]),
    media: z.object({
      media_type: z.enum(["movie", "tv"]),
      imdbId: z.string().transform((val) => (val === "" ? null : val)),
      tmdbId: z.string().transform((val) => (val === "" ? null : val)),
      tvdbId: z.string().transform((val) => (val === "" ? null : val)),
    }),
    request: z.object({
      request_id: z.string(),
      requestedBy_email: z.string(),
    }),
    extra: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    ),
  })
  .transform((val) => {
    const requestedSeasons = val.extra
      .find((extra) => extra.name.toLowerCase() === "requested seasons")
      ?.value.split(",")
      .map((s) => parseInt(s.trim(), 10));

    return {
      ...val,
      requestedSeasons,
    };
  });

export const WebhookInput = z.discriminatedUnion("notification_type", [
  TestNotification,
  WebhookNotification,
]);

export type WebhookInput = z.infer<typeof WebhookInput>;
