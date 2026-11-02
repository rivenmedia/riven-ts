"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

import { Button } from "#components/_ui/button.tsx";
import { buildSettingsConfigFromZodSchema } from "#components/settings/_utilities/build-settings-config-from-zod-schema.ts";
import { SettingField } from "#components/settings/setting-field/setting-field.tsx";

import { saveSettingsGroup } from "./_actions/save-settings-group.action";

interface SettingsGroupProps {
  name: string;
}

export function SettingsGroup({ name }: SettingsGroupProps) {
  const { form, handleSubmitWithAction } = useHookFormAction(
    saveSettingsGroup,
    zodResolver(z.object({})),
    {
      actionProps: {},
      formProps: {},
    },
  );

  const { isDirty } = form.formState;

  return (
    <form
      onSubmit={(event) => {
        void handleSubmitWithAction(event);
      }}
    >
      <FormProvider {...form}>
        <div className="space-y-8">
          <SettingField
            type="group"
            config={{
              name,
              schema: buildSettingsConfigFromZodSchema(z.object({}))
                .values()
                .toArray(),
            }}
          />
          <Button disabled={!isDirty} type="submit">
            Save
          </Button>
        </div>
      </FormProvider>
    </form>
  );
}
