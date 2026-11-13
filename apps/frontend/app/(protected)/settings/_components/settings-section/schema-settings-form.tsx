"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { groupBy } from "es-toolkit";
import { has, pick, set } from "es-toolkit/compat";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "#components/_ui/button.tsx";
import { FieldError } from "#components/_ui/field.tsx";
import { buildSettingsConfigFromZodSchema } from "#components/settings/_utilities/build-settings-config-from-zod-schema.ts";
import { SettingField } from "#components/settings/setting-field/setting-field.tsx";

import { toSectionSubmission } from "./_utilities/to-section-submission";

import type {
  SettingsIssue,
  SettingsSection,
} from "#app/_types/__generated__/graphql.ts";
import type { BuildSettingsContext } from "#components/settings/_utilities/build-settings-config-from-zod-schema.ts";
import type { SettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";
import type { SectionSubmission } from "./_utilities/to-section-submission";

type FormIssue = Pick<SettingsIssue, "path" | "message">;

/** What became of a submission: saved, or refused with the issues it has. */
export type SchemaSettingsSubmitResult =
  | { saved: true }
  | { saved: false; issues: FormIssue[] };

/** Every rendered field, without the groups around them. */
function getFields(fields: SettingFieldProps[]): SettingFieldProps[] {
  return fields.flatMap((field) =>
    field.type === "group" ? getFields(field.config.schema) : [field],
  );
}

/** Whether an issue's path belongs to a rendered field (or an item within one). */
function isFieldPath(path: string, fieldNames: string[]) {
  return fieldNames.some(
    (name) => path === name || path.startsWith(`${name}.`),
  );
}

/** Formats an issue that can't be shown against a field. */
export function formatSectionIssue({ path, message }: FormIssue) {
  return path ? `${path}: ${message}` : message;
}

export interface SchemaSettingsFormProps extends Pick<
  SettingsSection,
  "jsonSchema" | "values" | "lockedFields" | "secretStates" | "issues"
> {
  /** Heading of the group the fields are rendered in. */
  title: string;
  submitLabel: string;
  /**
   * Called with the changed values and the emptied fields to reset. Its result
   * lets the form start clean from a saved submission, or show the issues of a
   * refused one.
   */
  onSubmit: (
    submission: SectionSubmission,
  ) => Promise<SchemaSettingsSubmitResult>;
  isPending: boolean;
  /** Resets a secret field to its default. Without it, secrets can't be reset. */
  onResetSecret?: (path: string) => void;
}

/**
 * Renders a served JSON Schema as a form of setting fields. Validation is for
 * UX only; the backend is authoritative.
 */
export function SchemaSettingsForm({
  title,
  jsonSchema,
  values,
  lockedFields,
  secretStates,
  issues,
  submitLabel,
  onSubmit,
  isPending,
  onResetSecret,
}: SchemaSettingsFormProps) {
  // A served JSON Schema always describes an object of values
  const schema = useMemo(
    () =>
      z.fromJSONSchema(jsonSchema) as z.ZodType<
        Record<string, unknown>,
        Record<string, unknown>
      >,
    [jsonSchema],
  );

  const fields = useMemo(() => {
    const context: BuildSettingsContext = {
      lockedFields: new Set(lockedFields),
      secretStates: new Map(
        secretStates.map(({ path, state }) => [path, state]),
      ),
      ...(onResetSecret && { onResetSecret }),
    };

    return buildSettingsConfigFromZodSchema(
      schema,
      undefined,
      true,
      {},
      context,
    )
      .values()
      .toArray();
  }, [schema, lockedFields, secretStates, onResetSecret]);

  const [fieldNames, secretFieldNames, clearableFieldNames] = useMemo(() => {
    const leafFields = getFields(fields);

    return [
      leafFields.map(({ config }) => config.name),
      leafFields
        .filter(({ type }) => type === "secret")
        .map(({ config }) => config.name),
      // A blank secret is left unchanged, and a locked field can't be edited
      leafFields
        .filter(({ type, config }) => type !== "secret" && !config.locked)
        .map(({ config }) => config.name),
    ] as const;
  }, [fields]);

  // Only rendered fields are submitted, so values for fields that can't be
  // rendered (e.g. unions) are never sent back. Secrets are write-only, so they
  // start blank, which the backend treats as unchanged.
  const defaultValues = useMemo(() => {
    const renderedValues = pick(values, fieldNames);

    // A field with no value (e.g. an optional number) registers as
    // `undefined`, so it's seeded as that to keep the form from starting dirty
    for (const name of fieldNames) {
      if (!has(renderedValues, name)) {
        set(renderedValues, name, undefined);
      }
    }

    for (const name of secretFieldNames) {
      set(renderedValues, name, "");
    }

    return renderedValues;
  }, [values, fieldNames, secretFieldNames]);

  // Issues that can't be shown against a field are shown for the form
  const storedSectionIssues = useMemo(
    () => issues.filter(({ path }) => !isFieldPath(path, fieldNames)),
    [issues, fieldNames],
  );
  const [savedSectionIssues, setSavedSectionIssues] = useState<FormIssue[]>([]);

  const form = useForm({
    defaultValues,
    resolver: zodResolver(schema, undefined, {
      // Raw values, so the served schema's defaults aren't filled in for fields
      // that aren't rendered
      raw: true,
    }),
  });

  /** Starts clean from the saved values, with secrets blanked again as they're write-only. */
  const resetToSavedValues = () => {
    const savedValues = structuredClone(form.getValues());

    for (const name of secretFieldNames) {
      set(savedValues, name, "");
    }

    // A reset field is left empty, which the revalidated stored values
    // fill in with the value it now has (e.g. its default)
    form.reset(savedValues);
  };

  /** Shows a refused submission's issues, keyed by the form's field paths. */
  const showSavedIssues = (savedIssues: FormIssue[]) => {
    const fieldIssues = groupBy(
      savedIssues.filter(({ path }) => isFieldPath(path, fieldNames)),
      ({ path }) => path,
    );

    for (const [path, pathIssues] of Object.entries(fieldIssues)) {
      form.setError(path, {
        type: "server",
        message: pathIssues.map(({ message }) => message).join(" "),
      });
    }

    setSavedSectionIssues(
      savedIssues.filter(({ path }) => !isFieldPath(path, fieldNames)),
    );
  };

  // An emptied field is reset, rather than saved, so it returns to its
  // default or becomes unset
  const handleSubmit = form.handleSubmit(async (formValues) => {
    setSavedSectionIssues([]);

    const result = await onSubmit(
      toSectionSubmission(
        formValues,
        form.formState.defaultValues ?? {},
        clearableFieldNames,
      ),
    );

    if (result.saved) {
      resetToSavedValues();
    } else {
      showSavedIssues(result.issues);
    }
  });

  useEffect(() => {
    form.reset(defaultValues, {
      // Revalidating the page (e.g. after a secret reset) brings new stored
      // values, which mustn't discard edits that haven't been saved yet. An
      // emptied field has no value to keep, so it takes the new stored value.
      keepDirtyValues: true,
    });

    // Issues with the stored values are shown before any submit
    for (const { path, message } of issues) {
      if (isFieldPath(path, fieldNames)) {
        form.setError(path, { type: "server", message });
      }
    }
  }, [form, defaultValues, issues, fieldNames]);

  const { isDirty } = form.formState;
  const sectionIssues = [...storedSectionIssues, ...savedSectionIssues];

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <FormProvider {...form}>
        <div className="space-y-8">
          <SettingField type="group" config={{ name: title, schema: fields }} />
          {sectionIssues.length > 0 && (
            <FieldError
              errors={sectionIssues.map((issue) => ({
                message: formatSectionIssue(issue),
              }))}
            />
          )}
          <Button disabled={!isDirty || isPending} type="submit">
            {submitLabel}
          </Button>
        </div>
      </FormProvider>
    </form>
  );
}
