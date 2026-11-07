import { Authorized, Query, Resolver } from "type-graphql";

@Authorized()
@Resolver()
export class NotificationsResolver {
  @Query(() => Boolean)
  public notificationsIsConfigured(): boolean {
    return true;
  }
}
