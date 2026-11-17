"use client";

import { useAction } from "next-safe-action/hooks";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { resetSettingsFields } from "./_actions/reset-settings-fields.action";
import { updateSettingsSection } from "./_actions/update-settings-section.action";
import { validationErrorsToIssues } from "./_utilities/validation-errors-to-issues";
import { SchemaSettingsForm, formatSectionIssue } from "./schema-settings-form";

import type { SettingsSection } from "#app/_types/__generated__/graphql.ts";
import type { SectionSubmission } from "./_utilities/to-section-submission";
import type { SchemaSettingsSubmitResult } from "./schema-settings-form";

export type SettingsSectionFormProps = Omit<SettingsSection, "__typename">;

/**
 * Renders a backend settings section as a form, built from the section's
 * served JSON Schema, which saves and resets its fields.
 */
export function SettingsSectionForm({
  id,
  title,
  appliesImmediately,
  jsonSchema,
  values,
  lockedFields,
  secretStates,
  issues,
}: SettingsSectionFormProps) {
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
      toast.success(
        appliesImmediately
          ? "Setting reset."
          : "Setting reset. Restart Riven to apply it.",
      );
    },
    onError({ error }) {
      const resetIssues = validationErrorsToIssues(error.validationErrors);

      if (resetIssues.length === 0) {
        toast.error(error.serverError ?? "Failed to reset the setting");
      }

      for (const issue of resetIssues) {
        toast.error(formatSectionIssue(issue));
      }
    },
  });

  const handleResetSecret = useCallback(
    (path: string) => {
      executeReset({ paths: [path] });
    },
    [executeReset],
  );

  const { executeAsync: executeUpdate, isPending } = useAction(updateSection, {
    onSuccess() {
      toast.success(
        appliesImmediately
          ? "Settings saved."
          : "Settings saved. Restart Riven to apply them.",
      );
    },
    onError({ error }) {
      if (error.serverError) {
        toast.error(error.serverError);
      }
    },
  });

  const handleSubmit = async (
    submission: SectionSubmission,
  ): Promise<SchemaSettingsSubmitResult> => {
    const { data, validationErrors } = await executeUpdate(submission);

    // Issues are keyed by the form's field paths, not the action's input
    return data
      ? { saved: true }
      : { saved: false, issues: validationErrorsToIssues(validationErrors) };
  };

  return (
    <SchemaSettingsForm
      title={title}
      jsonSchema={jsonSchema}
      values={values}
      lockedFields={lockedFields}
      secretStates={secretStates}
      issues={issues}
      submitLabel="Save"
      onSubmit={handleSubmit}
      isPending={isPending}
      onResetSecret={handleResetSecret}
    />
  );
}
