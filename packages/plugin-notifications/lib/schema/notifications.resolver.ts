import { Query, Resolver } from "type-graphql";

@Resolver()
export class NotificationsResolver {
  @Query((_returns) => Boolean)
  notificationsIsConfigured(): boolean {
    return true;
  }
}
