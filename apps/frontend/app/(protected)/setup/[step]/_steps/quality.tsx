import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/_ui/accordion";
import { Button } from "@/components/_ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/_ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/_ui/radio-group";
import { SettingField } from "@/components/settings/setting-field/setting-field";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import type { SettingFieldProps } from "@/components/settings/setting-field/setting-field";

export interface Profile {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface GeneralSection {
  title: string;
  description: string;
  fields: SettingFieldProps[];
}

export interface SetupQualityStepProps {
  profiles: Profile[];
  generalSections: GeneralSection[];
}

const QualityFormSchema = z.object({
  selectedProfile: z.string(),
});

export function SetupQualityStep({
  profiles,
  generalSections,
}: SetupQualityStepProps) {
  const defaultSelectedProfile =
    profiles.find((profile) => profile.enabled)?.id ?? "";

  const form = useForm({
    resolver: zodResolver(QualityFormSchema),
    defaultValues: {
      selectedProfile: defaultSelectedProfile,
    },
  });

  const handleSubmit = form.handleSubmit(() => {
    /* empty */
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

          <Accordion type="multiple" className="space-y-4">
            {generalSections.map((section) => (
              <AccordionItem
                key={section.title}
                value={section.title}
                className="rounded-2xl border px-5"
              >
                <AccordionTrigger className="py-5 text-left no-underline hover:no-underline">
                  <span>
                    <span className="block text-lg font-semibold">
                      {section.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-sm">
                      {section.description}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {section.fields.map((field) => (
                      <SettingField key={field.config.name} {...field} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="flex justify-end">
            <Button type="submit">Save preferences</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
