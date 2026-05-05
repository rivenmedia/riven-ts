import z from "zod";

export const WebhookInput = z.object({
  notification_type: z.string(),
  media: z.object({
    media_type: z.enum(["movie", "tv"]),
    imdbId: z.string().transform((val) => (val === "" ? null : val)),
    tmdbId: z.string().transform((val) => (val === "" ? null : val)),
    tvdbId: z.string().transform((val) => (val === "" ? null : val)),
  }),
  request: z.object({
    request_id: z.string(),
    requestedBy_email: z.string(),
    requestedBy_username: z.string(),
  }),
  extra: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
});

/**
 * {
  notification_type: 'MEDIA_AUTO_APPROVED',
  event: 'Movie Request Automatically Approved',
  subject: 'Apex (2026)',
  message: "A grieving woman pushing her limits on a solo adventure in the Australian wild is ensnared in a twisted game with a cunning killer who thinks she's prey.",
  image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/eTp7gSPkSF3Aw79mNx1NkBP1PZT.jpg',
  media: {
    media_type: 'movie',
    imdbId: '',
    tmdbId: '1318447',
    tvdbId: '',
    jellyfinMediaId: '',
    status: 'PENDING',
    status4k: 'UNKNOWN'
  },
  request: {
    request_id: '97',
    requestedBy_email: 'joe@joemck.ie',
    requestedBy_username: 'jmckie',
    requestedBy_avatar: 'https://plex.tv/users/710e8ca8cb876ba5/avatar?c=1777734838',
    requestedBy_jellyfinUserId: '',
    requestedBy_settings_discordId: '',
    requestedBy_settings_telegramChatId: ''
  },
  issue: null,
  comment: null,
  extra: []
}
 */
