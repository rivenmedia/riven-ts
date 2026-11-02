"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { pick } from "es-toolkit/compat";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#components/_ui/button.tsx";
import { buildSettingsConfigFromZodSchema } from "#components/settings/_utilities/build-settings-config-from-zod-schema.ts";
import { SettingField } from "#components/settings/setting-field/setting-field.tsx";

import { resetSettingsFields } from "./_actions/reset-settings-fields.action";
import { updateSettingsSection } from "./_actions/update-settings-section.action";

import type { BuildSettingsContext } from "#components/settings/_utilities/build-settings-config-from-zod-schema.ts";
import type {
  SecretState,
  SettingFieldProps,
} from "#components/settings/setting-field/setting-field.tsx";

/** The form paths of every rendered field, without the groups around them. */
function getFieldNames(fields: SettingFieldProps[]): string[] {
  return fields.flatMap((field) =>
    field.type === "group"
      ? getFieldNames(field.config.schema)
      : [field.config.name],
  );
}

export interface SettingsSectionFormProps {
  id: string;
  title: string;
  jsonSchema: Record<string, unknown>;
  values: Record<string, unknown>;
  lockedFields: string[];
  secretStates: { path: string; state: SecretState }[];
  issues: { path: string; message: string }[];
}

/**
 * Renders a backend settings section as a form, built from the section's
 * served JSON Schema. Validation is for UX only; the backend is authoritative.
 */
export function SettingsSectionForm({
  id,
  title,
  jsonSchema,
  values,
  lockedFields,
  secretStates,
  issues,
}: SettingsSectionFormProps) {
  // A section's JSON Schema always describes an object of values
  const schema = useMemo(
    () =>
      z.fromJSONSchema(jsonSchema) as z.ZodType<
        Record<string, unknown>,
        Record<string, unknown>
      >,
    [jsonSchema],
  );

  // Bound once per section, as the hooks' callbacks change with the action
  const [updateSection, resetFields] = useMemo(
    () =>
      [
        updateSettingsSection.bind(null, id),
        resetSettingsFields.bind(null, id),
      ] as const,
    [id],
  );

  const { execute: executeReset } = useAction(resetFields, {
    onSuccess() {
      toast.success("Setting reset. Restart Riven to apply it.");
    },
    onError({ error }) {
      toast.error(error.serverError ?? "Failed to reset the setting");
    },
  });

  const fields = useMemo(() => {
    const context: BuildSettingsContext = {
      lockedFields: new Set(lockedFields),
      secretStates: new Map(
        secretStates.map(({ path, state }) => [path, state]),
      ),
      onResetSecret: (path) => {
        executeReset({ paths: [path] });
      },
    };

    return [
      ...buildSettingsConfigFromZodSchema(
        schema,
        undefined,
        true,
        {},
        context,
      ).values(),
    ];
  }, [schema, lockedFields, secretStates, executeReset]);

  // Only rendered fields are submitted, so values for fields that can't be
  // rendered (e.g. unions) are never sent back
  const defaultValues = useMemo(
    () => pick(values, getFieldNames(fields)),
    [values, fields],
  );

  const { form, action, handleSubmitWithAction } = useHookFormAction(
    updateSection,
    // Raw values, so the served schema's defaults aren't filled in for fields
    // that aren't rendered
    zodResolver(schema, undefined, { raw: true }),
    {
      formProps: { defaultValues },
      actionProps: {
        onSuccess() {
          toast.success("Settings saved. Restart Riven to apply them.");
        },
        onError({ error }) {
          if (error.serverError) {
            toast.error(error.serverError);
          }
        },
      },
    },
  );

  useEffect(() => {
    // A save revalidates the page with the stored values, so the form starts
    // clean from them (which also blanks any secret that was just typed)
    form.reset(defaultValues);

    // Issues with the stored values are shown before any submit
    for (const { path, message } of issues) {
      form.setError(path, { type: "server", message });
    }
  }, [form, defaultValues, issues]);

  const { isDirty } = form.formState;

  return (
    <form
      onSubmit={(event) => {
        void handleSubmitWithAction(event);
      }}
    >
      <FormProvider {...form}>
        <div className="space-y-8">
          <SettingField type="group" config={{ name: title, schema: fields }} />
          <Button disabled={!isDirty || action.isPending} type="submit">
            Save
          </Button>
        </div>
      </FormProvider>
    </form>
  );
}
