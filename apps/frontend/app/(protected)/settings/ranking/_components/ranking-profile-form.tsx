"use client";

import { isNavigationError } from "next-safe-action";
import { useAction } from "next-safe-action/hooks";
import { useMemo } from "react";
import { toast } from "sonner";

import { validationErrorsToIssues } from "../../_components/settings-section/_utilities/validation-errors-to-issues";
import { SchemaSettingsForm } from "../../_components/settings-section/schema-settings-form";
import { createRankingProfile } from "../_actions/create-ranking-profile.action";
import { updateRankingProfile } from "../_actions/update-ranking-profile.action";

import type { SectionSubmission } from "../../_components/settings-section/_utilities/to-section-submission";
import type {
  SchemaSettingsFormProps,
  SchemaSettingsSubmitResult,
} from "../../_components/settings-section/schema-settings-form";

// Stable, as new arrays would rebuild the form's fields and reset it on every
// render, discarding a refused submission's issues
const NO_LOCKED_FIELDS: string[] = [];
const NO_SECRET_STATES: SchemaSettingsFormProps["secretStates"] = [];
const NO_ISSUES: SchemaSettingsFormProps["issues"] = [];

export interface RankingProfileFormProps {
  /** The served JSON Schema of the profile form. */
  jsonSchema: Record<string, unknown>;
  /** The profile's full form values, which the form starts from. */
  values: Record<string, unknown>;
  /** The custom profile being edited. Without it, a new profile is created. */
  profileId?: string;
}

/**
 * Creates or edits a ranking profile, with a form rendered from the served
 * profile schema. Returns to the ranking profiles once saved.
 */
export function RankingProfileForm({
  jsonSchema,
  values,
  profileId,
}: RankingProfileFormProps) {
  const saveProfile = useMemo(
    () =>
      profileId === undefined
        ? createRankingProfile
        : updateRankingProfile.bind(null, profileId),
    [profileId],
  );

  const { executeAsync, isPending } = useAction(saveProfile, {
    onNavigation() {
      toast.success(
        profileId === undefined
          ? "Ranking profile created."
          : "Ranking profile saved.",
      );
    },
    onError({ error }) {
      if (error.serverError) {
        toast.error(error.serverError);
      }
    },
  });

  // Every rendered value is sent, as the profile is saved whole. An emptied
  // field is left out, so it takes its default.
  const handleSubmit = async ({
    values: submittedValues,
  }: SectionSubmission): Promise<SchemaSettingsSubmitResult> => {
    try {
      const { validationErrors } = await executeAsync({
        values: submittedValues,
      });

      // Issues are keyed by the form's field paths, not the action's input
      return {
        saved: false,
        issues: validationErrorsToIssues(validationErrors),
      };
    } catch (error) {
      // A saved profile redirects to the ranking profiles
      if (isNavigationError(error)) {
        return { saved: true };
      }

      return {
        saved: false,
        issues: [{ path: "", message: "Failed to save the ranking profile" }],
      };
    }
  };

  return (
    <SchemaSettingsForm
      title="Profile"
      jsonSchema={jsonSchema}
      values={values}
      lockedFields={NO_LOCKED_FIELDS}
      secretStates={NO_SECRET_STATES}
      issues={NO_ISSUES}
      submitLabel={profileId === undefined ? "Create profile" : "Save profile"}
      onSubmit={handleSubmit}
      isPending={isPending}
    />
  );
}
