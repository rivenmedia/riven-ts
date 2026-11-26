import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { selectRankingProfile } from "#app/(protected)/settings/ranking/_actions/select-ranking-profile.action.ts";
import { Button } from "#components/_ui/button.tsx";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "#components/_ui/field.tsx";
import { RadioGroup, RadioGroupItem } from "#components/_ui/radio-group.tsx";

interface Profile {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface SetupQualityStepProps {
  profiles: Profile[];
}

const QualityFormSchema = z.object({
  selectedProfile: z.string(),
});

/**
 * Setup step for choosing a quality/ranking profile.
 */
export function SetupQualityStep({ profiles }: SetupQualityStepProps) {
  const defaultSelectedProfile =
    profiles.find((profile) => profile.enabled)?.id ?? "";

  const form = useForm({
    resolver: zodResolver(QualityFormSchema),
    defaultValues: {
      selectedProfile: defaultSelectedProfile,
    },
  });

  const { execute } = useAction(selectRankingProfile);

  const handleSubmit = form.handleSubmit(({ selectedProfile }) => {
    execute({ id: selectedProfile });
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Pre-configured presets</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Start with the built-in defaults.
              </p>
            </div>
            <RadioGroup
              {...form.register("selectedProfile", { required: true })}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              defaultValue={defaultSelectedProfile}
            >
              {profiles.map((profile) => (
                <FieldLabel key={profile.id} htmlFor={profile.id}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{profile.label}</FieldTitle>
                      <FieldDescription>{profile.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={profile.id} id={profile.id} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save preferences</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
