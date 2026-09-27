import { FileSizeUnitShort } from "@repo/util-plugin-sdk/dto/enums/file-size-unit-short.enum";

import { Field, Float, ObjectType } from "type-graphql";

@ObjectType()
export class FileSize {
  @Field(() => Float, {
    description:
      "The size of the file in the specified units, rounded to the specified precision.",
  })
  public size!: number;

  @Field(() => FileSizeUnitShort.enum, {
    description:
      "The unit of measurement for the file size. This can be one of the following: B (bytes), KiB (kibibytes), MiB (mebibytes), or GiB (gibibytes).",
  })
  public units!: FileSizeUnitShort;
}
