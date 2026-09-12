import { Button } from "@/components/_ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Label } from "@/components/_ui/label";
import { Switch } from "@/components/_ui/switch";

import { FormProvider, useForm } from "react-hook-form";

import { SettingGroup } from "../../setting-group/setting-group";

import type { PluginTab } from "../../plugins-tab/plugins-tab";

export interface SinglePluginTabProps {
  plugin: PluginTab;
}

export function SinglePluginTab({ plugin }: { plugin: PluginTab }) {
  const defaultValues: {
    [key: string]: unknown;
    isEnabled: boolean;
  } = {
    isEnabled: plugin.isEnabled,
  };

  for (const field of plugin.fields) {
    defaultValues[field.config.name] = "";
  }

  const form = useForm<typeof defaultValues>({
    progressive: true,
    defaultValues,
    shouldUnregister: true,
  });

  const isEnabled = form.watch("isEnabled");

  const { isDirty } = form.formState;
  const { register, setValue } = form;

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>{plugin.title}</CardTitle>
          <CardDescription>
            Configure the settings for the {plugin.title} plugin.
          </CardDescription>
          <CardAction>
            <Label htmlFor="isEnabled">
              Enabled
              <Switch
                id="isEnabled"
                {...register("isEnabled")}
                defaultChecked={isEnabled}
                onCheckedChange={(checked) => {
                  setValue("isEnabled", checked, {
                    shouldDirty: true,
                  });
                }}
              />
            </Label>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <fieldset disabled={!isEnabled}>
            <SettingGroup title="Settings" schema={plugin.fields} />
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!isDirty}>
            Save
          </Button>
        </CardFooter>
      </Card>
    </FormProvider>
  );
}
