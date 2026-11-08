"use client";

import { RankingModelSchemaMetadata } from "@repo/util-rank-torrent-name";

import { FormProvider, useForm } from "react-hook-form";

import { Button } from "#components/_ui/button.tsx";
import { RankingModelSchema } from "#components/settings/ranking-tab/ranking-tab.form-schema.ts";
import { SettingField } from "#components/settings/setting-field/setting-field.tsx";

import type { RankingModel } from "#components/settings/ranking-tab/ranking-tab.form-schema.ts";
import type { SettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";

export default function CreateRankingProfilePage() {
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
      <h2 className="text-xl font-bold">Create Ranking Profile</h2>
      <p className="text-sm text-muted-foreground">
        Define the settings for your new ranking profile below.
      </p>
      <FormProvider {...form}>
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
      </FormProvider>
    </div>
  );
}
