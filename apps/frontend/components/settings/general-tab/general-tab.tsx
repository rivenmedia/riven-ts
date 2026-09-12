import { Button } from "@/components/_ui/button";
import { LogLevel } from "@repo/feature-settings/enums/log-level.enum";

import { zodResolver } from "@hookform/resolvers/zod";
import { startCase } from "es-toolkit";
import { FormProvider, useForm } from "react-hook-form";

import { SettingGroup } from "../setting-group/setting-group";
import { GeneralTabFormSchema } from "./general-tab.form-schema";

import type { GeneralTabFormValues } from "./general-tab.form-schema";

export interface GeneralTabProps {
  data: GeneralTabFormValues;
}

export function GeneralTab({ data }: GeneralTabProps) {
  const form = useForm({
    defaultValues: data,
    resolver: zodResolver(GeneralTabFormSchema),
  });

  const { isDirty } = form.formState;

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        <SettingGroup
          title="Instance"
          schema={[
            {
              type: "text",
              config: {
                label: "Instance Name",
                name: "instanceName",
              },
            },
            {
              type: "select",
              config: {
                label: "Log Level",
                name: "logLevel",
                options: Object.values(LogLevel)
                  .toReversed()
                  .map((level) => ({
                    label: startCase(level),
                    value: level,
                  })),
              },
            },
          ]}
        />
        <SettingGroup
          title="Notifications"
          schema={[
            {
              type: "boolean",
              config: {
                label: "Enable Notifications",
                name: "enableNotifications",
              },
            },
          ]}
        />
        <Button disabled={!isDirty} type="submit">
          Save general settings
        </Button>
      </div>
    </FormProvider>
  );
}
