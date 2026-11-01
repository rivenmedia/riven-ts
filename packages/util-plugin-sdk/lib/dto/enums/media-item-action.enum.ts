import z from "zod";

export const MediaItemAction = z.enum([
  /**
   * Action to request a single item (e.g. for a movie)
   */
  "request_single",

  /**
   * Action to request multiple items (e.g. for a show)
   */
  "request_multiple",

  /**
   * Action to request more items (e.g. additional seasons for a show)
   */
  "request_more",

  /**
   * Action to retry a previously failed request
   */
  "retry",

  /**
   * Action to reset a previously made request
   */
  "reset",

  /**
   * Action to resume a previously paused request
   */
  "resume",

  /**
   * Action to pause an ongoing request
   */
  "pause",

  /**
   * Action to delete a previously made request
   */
  "delete",

  /**
   * Action to blacklist the active stream
   */
  "blacklist_active_stream",

  /**
   * Action to manually scrape item data
   */
  "manual_scrape",
]);

export type MediaItemAction = z.infer<typeof MediaItemAction>;
