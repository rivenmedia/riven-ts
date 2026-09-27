import { i18n } from "@/.storybook/i18n";

import { Settings } from "luxon";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

import type { Decorator } from "@storybook/nextjs-vite";

export const WithI18n: Decorator = (Story, { globals }) => {
  const [, setActiveLocale] = useState(globals.locale);

  i18n.on("languageChanged", (locale) => {
    // Persist locale to state to force re-render after a change.
    // This ensures Luxon instances receive the new Settings.defaultLocale.
    setActiveLocale(() => {
      Settings.defaultLocale = locale;

      document.dir = i18n.dir(locale);

      return locale;
    });
  });

  // When the locale global changes
  // Set the new locale in i18n
  useEffect(() => {
    void i18n.changeLanguage(globals.locale);
  }, [globals.locale]);

  return (
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  );
};
