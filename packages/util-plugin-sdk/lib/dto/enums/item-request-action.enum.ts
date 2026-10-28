import z from "zod";

export const ItemRequestAction = z.enum([
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
]);

export type ItemRequestAction = z.infer<typeof ItemRequestAction>;
