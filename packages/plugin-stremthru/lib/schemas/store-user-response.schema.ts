import z from "zod";

const UserSubscriptionStatus = z.enum(["expired", "premium", "trial"]);

export const StoreUserResponse = z.object({
  data: z.object({
    id: z.string(),
    email: z.string(),
    subscription_status: UserSubscriptionStatus,
    has_usenet: z.boolean(),
  }),
});

export type StoreUserResponse = z.infer<typeof StoreUserResponse>;
