import { Button } from "@/components/_ui/button";
import { createSettings, SettingsSchema } from "@repo/util-rank-torrent-name";

import { FormProvider, useForm } from "react-hook-form";

import { buildSettingsConfigFromZodSchema } from "../../_utilities/build-settings-config-from-zod-schema";
import { SettingField } from "../../setting-field/setting-field";

export function RankingSettingsTab() {
  const parsedSettingsFields = buildSettingsConfigFromZodSchema(SettingsSchema);

  const form = useForm({
    defaultValues: createSettings(),
    progressive: true,
  });

  const { isDirty } = form.formState;

  return (
    <div className="space-y-4">
      <FormProvider {...form}>
        <SettingField
          type="group"
          config={{
            name: "Ranking Settings",
            schema: parsedSettingsFields.values().toArray(),
          }}
        />
        <Button disabled={!isDirty} type="submit">
          Save ranking settings
        </Button>
      </FormProvider>
    </div>
  );
}
