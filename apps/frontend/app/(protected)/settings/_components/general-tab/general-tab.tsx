"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { use } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

import { Button } from "#components/_ui/button.tsx";
import { buildSettingsConfigFromZodSchema } from "#components/settings/_utilities/build-settings-config-from-zod-schema.ts";
import { SettingField } from "#components/settings/setting-field/setting-field.tsx";

import { saveGeneralSettings } from "./_actions/save-general-settings.action.ts";
import { loadSettingsSchema } from "./_data-access/load-settings-schema.ts";

/**
 * Form for general instance settings, such as instance name and notifications.
 */
export function GeneralTab() {
  const settingsSchema = use(loadSettingsSchema());
  const zodSettingsSchema = z.fromJSONSchema(settingsSchema);

  const { form } = useHookFormAction(
    saveGeneralSettings,
    zodResolver(zodSettingsSchema),
    {
      formProps: {
        defaultValues: {},
      },
    },
  );

  const { isDirty } = form.formState;

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        <SettingField
          type="group"
          config={buildSettingsConfigFromZodSchema(zodSettingsSchema)
            .values()
            .toArray()}
        />
        <SettingField
          type="group"
          config={{
            name: "Notifications",
            schema: [
              {
                type: "boolean",
                config: {
                  label: "Enable Notifications",
                  name: "enableNotifications",
                },
              },
            ],
          }}
        />
        <Button disabled={!isDirty} type="submit">
          Save general settings
        </Button>
      </div>
    </FormProvider>
  );
}
