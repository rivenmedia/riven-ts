import { Settings } from "luxon";

declare module "luxon" {
  export interface TSSettings {
    throwOnInvalid: true;
  }
}

Settings.throwOnInvalid = true;

export * from "luxon";
