import { Field, ObjectType } from "type-graphql";

import type { ListrrContractsModelsAPIMovieDto } from "../../__generated__/index.ts";

@ObjectType()
export class ListrrItem implements Partial<ListrrContractsModelsAPIMovieDto> {
  @Field({ nullable: true })
  imDbId?: string;

  @Field({ nullable: true })
  tmDbId?: number;
}

@ObjectType()
export class ListrrItemsResponse {
  @Field(() => [ListrrItem], { nullable: true })
  items?: ListrrItem[] | undefined;
}
