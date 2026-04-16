import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { Field, ObjectType, registerEnumType } from "type-graphql";
import z from "zod";

import { MutationResponse } from "../../../interfaces/mutation-response.interface.ts";

const RequestItemMutationResponseErrorCode = z.enum([
  "conflict",
  "unexpected_error",
]);

type RequestItemMutationResponseErrorCode = z.infer<
  typeof RequestItemMutationResponseErrorCode
>;

registerEnumType(RequestItemMutationResponseErrorCode.enum, {
  name: "RequestItemMutationResponseErrorCode",
});

@ObjectType({ implements: MutationResponse })
export class RequestItemMutationResponse extends MutationResponse {
  @Field(() => RequestItemMutationResponseErrorCode.enum, { nullable: true })
  errorCode!: RequestItemMutationResponseErrorCode | null;

  @Field(() => ItemRequest, { nullable: true })
  item!: ItemRequest | null;
}
