import { Field, InterfaceType } from "type-graphql";
import { registerEnumType } from "type-graphql";
import z from "zod";

const StatusText = z.enum([
  "ok",
  "created",
  "bad_request",
  "unauthorized",
  "not_found",
  "conflict",
  "internal_server_error",
]);

registerEnumType(StatusText.enum, {
  name: "StatusText",
  valuesConfig: {
    ok: { description: "Success" },
    created: { description: "Created" },
    bad_request: { description: "Bad Request" },
    unauthorized: { description: "Unauthorized" },
    not_found: { description: "Not Found" },
    conflict: { description: "Conflict" },
    internal_server_error: { description: "Internal Server Error" },
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
