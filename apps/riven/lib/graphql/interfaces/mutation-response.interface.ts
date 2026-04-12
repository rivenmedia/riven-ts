import { Field, InterfaceType } from "type-graphql";
import { registerEnumType } from "type-graphql";
import z from "zod";

const StatusText = z.enum([
  "OK",
  "CREATED",
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL_SERVER_ERROR",
]);

registerEnumType(StatusText.enum, {
  name: "StatusText",
  valuesConfig: {
    OK: { description: "Success" },
    CREATED: { description: "Created" },
    BAD_REQUEST: { description: "Bad Request" },
    UNAUTHORIZED: { description: "Unauthorized" },
    NOT_FOUND: { description: "Not Found" },
    CONFLICT: { description: "Conflict" },
    INTERNAL_SERVER_ERROR: { description: "Internal Server Error" },
  },
});

@InterfaceType()
export class MutationResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => String)
  message!: string;

  @Field(() => StatusText.enum)
  statusText!: z.infer<typeof StatusText>;
}
