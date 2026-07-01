"use client";

import { Button } from "@/components/ui/button";

import { kebabCase } from "es-toolkit";
import Link from "next/link";

export interface Step {
  id: string;
  component: React.ComponentType;
  label: string;
  description: string;
}

export function useSteps(steps: readonly Step[], currentStepId: string) {
  const activeStepIndex = steps.findIndex(
    (s) => kebabCase(s.label) === currentStepId,
  );
  const activeStep = steps[activeStepIndex];

  if (!activeStep) {
    throw new Error(`Invalid step: ${currentStepId}`);
  }

  const renderActiveStep = () => {
    const ActiveStepComponent = activeStep.component;

    return <ActiveStepComponent />;
  };

  const renderPreviousButton = () => {
    const previousStep = steps[activeStepIndex - 1];

    return (
      <Button asChild type="button" variant="outline" disabled={!previousStep}>
        {previousStep ? (
          <Link href={`/setup/${previousStep.id}`}>Previous</Link>
        ) : (
          <span>Previous</span>
        )}
      </Button>
    );
  };

  const renderNextButton = () => {
    const nextStep = steps[activeStepIndex + 1];

    return (
      <Button asChild type="button" variant="outline" disabled={!nextStep}>
        {nextStep ? (
          <Link href={`/setup/${nextStep.id}`}>Next</Link>
        ) : (
          <span>Next</span>
        )}
      </Button>
    );
  };

  return {
    activeStep,
    activeStepIndex,
    renderActiveStep,
    renderPreviousButton,
    renderNextButton,
  };
}
