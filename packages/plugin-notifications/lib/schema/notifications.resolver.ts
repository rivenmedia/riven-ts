import { Query, Resolver } from "type-graphql";

@Resolver()
export class NotificationsResolver {
  @Query(() => Boolean)
  notificationsIsConfigured(): boolean {
    return true;
  }
}
