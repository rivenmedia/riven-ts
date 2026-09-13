import { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities";

import assert from "node:assert";
import { Arg, FieldResolver, Int, Resolver, Root } from "type-graphql";

import { FileSizeUnit } from "./enums/file-size-unit.enum.ts";
import { FileSize } from "./types/file-size.ts";

@Resolver(() => FileSystemEntry)
export class FileSystemEntryResolver {
  @FieldResolver(() => FileSize)
  public fileSize(
    @Root() entry: FileSystemEntry,
    @Arg("units", () => FileSizeUnit.enum, { defaultValue: "byte" })
    units: FileSizeUnit,
    @Arg("precision", () => Int, {
      defaultValue: 2,
      validateFn: (value: number) => {
        assert.ok(
          value >= 0 && value <= 5,
          "Precision must be between 0 and 5",
        );
      },
    })
    precision: number,
  ): FileSize | null {
    switch (units) {
      case "byte": {
        return {
          size: entry.fileSize,
          units: "B",
        };
      }
      case "kilobyte": {
        return {
          size: Number((entry.fileSize / 1024).toFixed(precision)),
          units: "KiB",
        };
      }
      case "megabyte": {
        return {
          size: Number((entry.fileSize / 1024 ** 2).toFixed(precision)),
          units: "MiB",
        };
      }
      case "gigabyte": {
        return {
          size: Number((entry.fileSize / 1024 ** 3).toFixed(precision)),
          units: "GiB",
        };
      }
    }
  }
}
