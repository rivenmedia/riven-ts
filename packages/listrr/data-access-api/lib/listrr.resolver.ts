import { Query, Resolver } from "type-graphql";

@Resolver()
export class ListrrResolver {
  @Query(() => [String])
  async movies(): Promise<string[]> {
    return [];
  }

  @Query(() => [String])
  async shows(): Promise<string[]> {
    return [];
  }
}
