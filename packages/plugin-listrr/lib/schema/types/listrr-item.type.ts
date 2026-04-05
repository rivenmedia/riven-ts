import { Field, ObjectType } from "type-graphql";

import type { ListrrContractsModelsAPIMovieDtoSchema } from "../../__generated__/zod/listrr/contracts/models/API/movieDtoSchema.ts";

@ObjectType()
export class ListrrItem implements Partial<ListrrContractsModelsAPIMovieDtoSchema> {
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
