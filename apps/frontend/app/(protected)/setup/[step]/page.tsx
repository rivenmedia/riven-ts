"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { use } from "react";

import { type Step, useSteps } from "./_hooks/use-steps";
import { SetupQualityStep } from "./_steps/quality";
import { SetupReviewStep } from "./_steps/review";
import { SetupWelcomeStep } from "./_steps/welcome";

export default function Page({ params }: PageProps<"/setup/[step]">) {
  const { step } = use(params);

  const steps = [
    {
      id: "welcome",
      component: SetupWelcomeStep,
      label: "Welcome",
      description: "Quick overview before you connect providers.",
    },
    {
      id: "quality",
      component: () => (
        <SetupQualityStep
          general={{}}
          generalSections={[]}
          profiles={[]}
          toggleProfileEnabled={() => {}}
          saveGeneralSettings={() => {}}
        />
      ),
      label: "Quality",
      description: "Choose profiles and instance defaults.",
    },
    {
      id: "review",
      component: () => (
        <SetupReviewStep
          blockers={[]}
          enabledProfileCount={0}
          finishSetup={() => {}}
          readyToComplete={false}
          validPluginCount={0}
        />
      ),
      label: "Review",
      description: "Check readiness and finish setup.",
    },
  ] as const satisfies readonly Step[];

  const {
    activeStep,
    activeStepIndex,
    renderActiveStep,
    renderPreviousButton,
    renderNextButton,
  } = useSteps(steps, step);

  return (
    <>
      <div className="mx-auto mb-5 w-full max-w-5xl overflow-x-auto pb-2">
        <div className="flex min-w-max items-center justify-start gap-0 px-1 md:justify-center">
          {steps.map(({ id, label }, index) => (
            <Button
              asChild
              key={label}
              type="button"
              variant="ghost"
              className={cn(
                "group relative h-auto min-w-28 justify-start gap-2 rounded-none border px-3 py-3 text-left first:rounded-l-xl first:border-r-0 last:rounded-r-xl sm:min-w-33",
                id === step
                  ? "border-white/14 bg-white/6 hover:bg-white/6"
                  : index < activeStepIndex
                    ? "bg-background/40 hover:bg-background/55 border-white/12"
                    : "bg-background/20 hover:bg-background/30 border-white/10",
              )}
            >
              <Link href={`/setup/${id}`}>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold",
                    index === activeStepIndex
                      ? "text-foreground border-white/16 bg-white/10"
                      : index < activeStepIndex
                        ? "text-foreground border-white/14 bg-white/6"
                        : "text-muted-foreground border-white/10",
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate pr-1 text-sm font-medium">
                  {label}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <Card className="bg-card/90 border-border/40 flex min-h-0 flex-1 rounded-3xl border py-0 shadow-lg">
          <CardHeader className="px-5 py-5 sm:px-6 md:px-10 md:py-6">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {activeStep.label}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                {activeStep.description}
              </p>
            </div>
          </CardHeader>
          <Separator className="opacity-60" />
          <CardContent className="min-h-0 flex-1 px-5 py-6 sm:px-6 md:px-10 md:py-10">
            {renderActiveStep()}
          </CardContent>
          <Separator className="opacity-60" />
          <CardFooter className="px-5 py-4 sm:px-6 md:px-10 md:py-5">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {renderPreviousButton()}
              {renderNextButton()}
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
