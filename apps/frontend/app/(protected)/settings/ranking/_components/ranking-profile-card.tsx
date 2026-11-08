"use client";

import { Check } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#components/_ui/card.tsx";

import { validationErrorsToIssues } from "../../_components/settings-section/_utilities/validation-errors-to-issues";
import { deleteRankingProfile } from "../_actions/delete-ranking-profile.action";
import { duplicateRankingProfile } from "../_actions/duplicate-ranking-profile.action";
import { selectRankingProfile } from "../_actions/select-ranking-profile.action";

import type { RankingProfile } from "#app/_types/__generated__/graphql.ts";

/** Toasts a profile action's success, or each issue that refused it. */
const toastActionResult = (successMessage: string, failureMessage: string) => ({
  onSuccess() {
    toast.success(successMessage);
  },
  onError({
    error,
  }: {
    error: {
      serverError?: string | undefined;
      validationErrors?: object | undefined;
    };
  }) {
    const issues = validationErrorsToIssues(error.validationErrors);

    if (issues.length === 0) {
      toast.error(error.serverError ?? failureMessage);
    }

    for (const { message } of issues) {
      toast.error(message);
    }
  },
});

export interface RankingProfileCardProps {
  profile: Pick<
    RankingProfile,
    "id" | "name" | "description" | "builtIn" | "isActive"
  >;
}

/**
 * A ranking profile with its actions. Built-in profiles can only be selected
 * or duplicated, and the active profile can't be deleted.
 */
export function RankingProfileCard({ profile }: RankingProfileCardProps) {
  const { id, name, description, builtIn, isActive } = profile;

  const select = useAction(
    selectRankingProfile,
    toastActionResult(
      "Ranking profile selected.",
      "Failed to select the ranking profile",
    ),
  );
  const duplicate = useAction(
    duplicateRankingProfile,
    toastActionResult(
      "Ranking profile duplicated.",
      "Failed to duplicate the ranking profile",
    ),
  );
  const remove = useAction(
    deleteRankingProfile,
    toastActionResult(
      "Ranking profile deleted.",
      "Failed to delete the ranking profile",
    ),
  );

  const isPending = select.isPending || duplicate.isPending || remove.isPending;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        {isActive ? (
          <Button disabled type="button">
            <Check /> Selected
          </Button>
        ) : (
          <Button
            disabled={isPending}
            type="button"
            onClick={() => {
              select.execute({ id });
            }}
          >
            Select
          </Button>
        )}
        {!builtIn && (
          <Button asChild variant="outline">
            <Link href={`/settings/ranking/profile/${id}`}>Edit</Link>
          </Button>
        )}
        <Button
          disabled={isPending}
          type="button"
          variant="outline"
          onClick={() => {
            duplicate.execute({ id });
          }}
        >
          Duplicate
        </Button>
        {!builtIn && (
          <Button
            disabled={isActive || isPending}
            type="button"
            variant="destructive"
            onClick={() => {
              remove.execute({ id });
            }}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
