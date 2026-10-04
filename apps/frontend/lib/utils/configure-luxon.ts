import { Settings } from "luxon";

declare module "luxon" {
  export interface TSSettings {
    throwOnInvalid: true;
  }
}

// Set outside of the configureLocale function to ensure it matches `TSSettings.throwOnInvalid: true`
Settings.throwOnInvalid = true;

/**
 * Configures the default locale for Luxon.
 *
 * @param locale The new default locale. Defaults to the browser language.
 */
export function configureLocale(locale = navigator.language) {
  Settings.defaultLocale = locale;
}
