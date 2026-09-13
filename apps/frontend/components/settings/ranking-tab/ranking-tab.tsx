import { Button } from "@/components/_ui/button";
import { RankingModelSchemaMetadata } from "@repo/util-rank-torrent-name";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { buildSettingsConfigFromZodSchema } from "../_utilities/build-settings-config-from-zod-schema";
import { SettingGroup } from "../setting-group/setting-group";
import { RankingProfileCard } from "./_components/ranking-profile-card";
import { RankingModelSchema, SettingsSchema } from "./ranking-tab.form-schema";

import type { SettingFieldProps } from "../setting-field/setting-field";
import type { RankingModel } from "./ranking-tab.form-schema";

export interface RankingTabProps {
  selectedProfile: string;
}

export function RankingTab({ selectedProfile }: RankingTabProps) {
  const parsedSettingsFields = buildSettingsConfigFromZodSchema(SettingsSchema);

  const defaultValues: Partial<RankingModel> = {};
  const settingCategories: Record<string, SettingFieldProps[]> = {};

  for (const [key, field] of Object.entries(RankingModelSchema.shape)) {
    const meta = RankingModelSchemaMetadata.parse(field.meta());

    settingCategories[meta.category] ??= [];
    settingCategories[meta.category]?.push({
      type: "custom_rank",
      config: {
        label: key,
        name: key,
      },
    });

    defaultValues[key as keyof RankingModel] = null;
  }

  const form = useForm({
    resolver: zodResolver(RankingModelSchema),
    defaultValues,
  });

  const { isDirty } = form.formState;

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        <SettingGroup
          title="Settings"
          description="General settings for the ranking system."
          schema={parsedSettingsFields}
        />
        <div>
          <h2 className="text-lg font-semibold">Ranking Profiles</h2>
          <p className="text-sm text-muted-foreground">
            Choose a ranking profile that best suits your needs, or customise
            your own settings if needed.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <RankingProfileCard
            title="Balanced"
            description="A good mix of quality and size."
            isSelected={selectedProfile === "balanced"}
          />
          <RankingProfileCard
            title="Best Quality"
            description="Highest resolution and bitrate."
            isSelected={selectedProfile === "best-quality"}
          />
          <RankingProfileCard
            title="Custom"
            description="Customise your ranking settings."
            isSelected={selectedProfile === "custom"}
          />
        </div>
        {selectedProfile === "custom" && (
          <>
            {Object.entries(settingCategories).map(([category, fields]) => (
              <SettingGroup
                key={category}
                title={category}
                schema={
                  new Map(fields.map((field) => [field.config.name, field]))
                }
              />
            ))}
            <Button disabled={!isDirty} type="submit">
              Save ranking settings
            </Button>
          </>
        )}
      </div>
    </FormProvider>
  );
}
