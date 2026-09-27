import { Button } from "@/components/_ui/button";
import { RankingModelSchemaMetadata } from "@repo/util-rank-torrent-name";

import { FormProvider, useForm } from "react-hook-form";

import { SettingField } from "../../setting-field/setting-field";
import { RankingModelSchema } from "../ranking-tab.form-schema";
import { RankingProfileCard } from "./ranking-profile-card";

import type { SettingFieldProps } from "../../setting-field/setting-field";
import type { RankingModel } from "../ranking-tab.form-schema";

export interface RankingProfilesTabProps {
  selectedProfile: string;
}

export function RankingProfilesTab({
  selectedProfile,
}: RankingProfilesTabProps) {
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

  const form = useForm({ defaultValues });

  const { isDirty } = form.formState;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ranking Profiles</h2>
        <p className="text-sm text-muted-foreground">
          Choose a ranking profile that best suits your needs, or customise your
          own settings if needed.
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
      <FormProvider {...form}>
        {selectedProfile === "custom" && (
          <>
            {Object.entries(settingCategories).map(([category, fields]) => (
              <SettingField
                key={category}
                type="group"
                config={{
                  name: category,
                  schema: fields,
                }}
              />
            ))}
            <Button disabled={!isDirty} type="submit">
              Save ranking settings
            </Button>
          </>
        )}
      </FormProvider>
    </div>
  );
}
