import { Field, Int, ObjectType } from "type-graphql";

export function createPaginationResultType<T>(itemType: T) {
  @ObjectType()
  abstract class PaginationResult<T> {
    @Field(() => [itemType], { description: "The items in the current page." })
    items!: T[];

    @Field(() => Int, {
      description:
        "The total number of items available across all pages. This field is optional and may not be included if `includeCount` is set to false.",
      nullable: true,
    })
    totalCount?: number;

    @Field(() => String, {
      description:
        "A cursor representing the starting point of the current page. This can be used to fetch the previous page of results.",
      nullable: true,
    })
    startCursor!: string | null;

    @Field(() => String, {
      description:
        "A cursor representing the ending point of the current page. This can be used to fetch the next page of results.",
      nullable: true,
    })
    endCursor!: string | null;

    @Field(() => Boolean, {
      description:
        "Indicates if there are more items available before the current page.",
    })
    hasPrevPage!: boolean;

    @Field(() => Boolean, {
      description:
        "Indicates if there are more items available after the current page.",
    })
    hasNextPage!: boolean;
  }

  return PaginationResult;
}
