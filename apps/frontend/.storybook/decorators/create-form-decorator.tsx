import { FormProvider, useForm } from "react-hook-form";

import type { Decorator } from "@storybook/nextjs-vite";
import type { UseFormProps } from "react-hook-form";

export function createFormDecorator<
  TFieldValues extends Record<string, unknown> = Record<string, unknown>,
>(useFormProps?: UseFormProps<TFieldValues>): Decorator {
  return function ReactHookFormStoryDecorator(Story) {
    const form = useForm<TFieldValues>(useFormProps);

    return (
      <FormProvider {...form}>
        <Story />
      </FormProvider>
    );
  };
}
