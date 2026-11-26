"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { groupBy } from "es-toolkit";
import { get, has, pick, set } from "es-toolkit/compat";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "#components/_ui/button.tsx";
import { FieldError } from "#components/_ui/field.tsx";

import { SettingField } from "./_components/setting-field/setting-field.tsx";
import { useStableValue } from "./_hooks/use-stable-value.ts";
import { buildSettingFields } from "./_utilities/build-setting-fields.ts";
import { toSectionSubmission } from "./_utilities/to-section-submission.ts";

import type {
  SettingsIssue,
  SettingsSection,
} from "#app/_types/__generated__/graphql.ts";
import type {
  SettingFieldProps,
  SettingValues,
} from "./_components/setting-field/setting-field.tsx";
import type { BuildSettingFieldsContext } from "./_utilities/build-setting-fields.ts";
import type { SectionSubmission } from "./_utilities/to-section-submission.ts";

export type { SectionSubmission } from "./_utilities/to-section-submission.ts";

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

/** Blanks every secret, as secrets are write-only and a blank one is left unchanged. */
function blankSecrets(values: SettingValues, secretFieldNames: string[]) {
  for (const name of secretFieldNames) {
    set(values, name, "");
  }

  return values;
}

/** Formats an issue that can't be shown against a field. */
export function formatSectionIssue({ path, message }: FormIssue) {
  return path ? `${path}: ${message}` : message;
}

export interface SchemaSettingsFormProps extends Pick<
  SettingsSection,
  "jsonSchema" | "values"
> {
  /** Heading of the group the fields are rendered in. */
  title: string;
  /** Paths of the settings set by environment variables, which can't be edited. */
  lockedFields?: SettingsSection["lockedFields"];
  /** Where each secret's value comes from. */
  secretStates?: Pick<
    SettingsSection["secretStates"][number],
    "path" | "state"
  >[];
  /** Issues with the stored values, shown before any submit. */
  issues?: FormIssue[];
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
 *
 * Emptying a field resets its setting, unless the setting is nullable (it's
 * saved as `null`), a secret (a blank secret is left unchanged) or locked.
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
  // Props are compared by value, so a caller passing new but equal arrays or
  // values doesn't rebuild the fields and reset the form
  const stableJsonSchema = useStableValue(jsonSchema);
  const stableValues = useStableValue(values);
  const stableLockedFields = useStableValue(lockedFields ?? []);
  const stableSecretStates = useStableValue(
    (secretStates ?? []).map(({ path, state }) => ({ path, state })),
  );
  const stableIssues = useStableValue(
    (issues ?? []).map(({ path, message }) => ({ path, message })),
  );

  const schema = useMemo(() => {
    const parsedSchema = z.fromJSONSchema(stableJsonSchema);

    // A served JSON Schema always describes an object of values
    if (!(parsedSchema instanceof z.ZodObject)) {
      throw new TypeError("The served settings schema isn't an object schema");
    }

    return parsedSchema;
  }, [stableJsonSchema]);

  const fields = useMemo(() => {
    const context: BuildSettingFieldsContext = {
      lockedFields: new Set(stableLockedFields),
      secretStates: new Map(
        stableSecretStates.map(({ path, state }) => [path, state]),
      ),
      ...(onResetSecret && { onResetSecret }),
    };

    return buildSettingFields(schema, undefined, {}, context)
      .values()
      .toArray();
  }, [schema, stableLockedFields, stableSecretStates, onResetSecret]);

  const [fieldNames, secretFieldNames, resettableFieldNames] = useMemo(() => {
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
  // rendered (e.g. unions) are never sent back
  const defaultValues = useMemo(() => {
    const renderedValues = structuredClone(pick(stableValues, fieldNames));

    // A field with no value (e.g. an optional number) is seeded as
    // `undefined`, which is also what emptying it gives, so the form doesn't
    // start dirty
    for (const name of fieldNames) {
      if (!has(renderedValues, name)) {
        set(renderedValues, name, undefined);
      }
    }

    return blankSecrets(renderedValues, secretFieldNames);
  }, [stableValues, fieldNames, secretFieldNames]);

  // Issues that can't be shown against a field are shown for the form
  const storedSectionIssues = useMemo(
    () => stableIssues.filter(({ path }) => !isFieldPath(path, fieldNames)),
    [stableIssues, fieldNames],
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

  /** Shows the issues with the stored values against their fields. */
  const showStoredIssues = useCallback(() => {
    for (const { path, message } of stableIssues) {
      if (isFieldPath(path, fieldNames)) {
        form.setError(path, { type: "server", message });
      }
    }
  }, [form, stableIssues, fieldNames]);

  // A save's result arrives after the render it was submitted from, by when
  // revalidating the page may have brought new stored issues
  const showLatestStoredIssues = useRef(showStoredIssues);

  useEffect(() => {
    showLatestStoredIssues.current = showStoredIssues;
  }, [showStoredIssues]);

  /**
   * Starts clean from the saved values, with secrets blanked again.
   *
   * @param resetFields Dotted paths of the fields the save reset.
   */
  const resetToSavedValues = (resetFields: string[]) => {
    const savedValues = structuredClone(form.getValues());
    const storedValues = form.formState.defaultValues;

    // A reset field is emptied, so it's filled with its stored value. If the
    // reset changed it (e.g. to its default), the revalidated stored values
    // differ and replace it, as it's clean. If not, they're equal to the
    // current ones, so the form isn't reset with them.
    for (const name of resetFields) {
      set(savedValues, name, structuredClone(get(storedValues, name)));
    }

    form.reset(blankSecrets(savedValues, secretFieldNames));

    // Resetting the form discards its errors, and unchanged stored issues
    // aren't shown again by revalidating the page
    showLatestStoredIssues.current();
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

  const handleSubmit = form.handleSubmit(async (formValues) => {
    setSavedSectionIssues([]);

    const submission = toSectionSubmission(
      formValues,
      form.formState.defaultValues ?? {},
      resettableFieldNames,
    );
    const result = await onSubmit(submission);

    if (result.saved) {
      resetToSavedValues(submission.reset);
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
    showStoredIssues();
  }, [form, defaultValues, showStoredIssues]);

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
