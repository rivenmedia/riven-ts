import { Query, Resolver } from "type-graphql";

@Resolver()
export class NotificationsResolver {
  @Query(() => Boolean)
  public notificationsIsConfigured(): boolean {
    return true;
  }
}
