import { FormProvider, useForm } from "react-hook-form";

import type { Decorator } from "@storybook/nextjs-vite";
import type { UseFormProps } from "react-hook-form";

export function createFormDecorator<
  TFieldValues extends Record<string, unknown> = Record<string, unknown>,
>(
  useFormProps?: UseFormProps<TFieldValues>,
  onSubmit?: (data: TFieldValues) => void,
): Decorator {
  return function ReactHookFormStoryDecorator(Story) {
    const form = useForm<TFieldValues>(useFormProps);

    return (
      <FormProvider {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();

            if (onSubmit) {
              void form.handleSubmit(onSubmit)(event);
            }
          }}
        >
          <Story />
          {onSubmit && <button type="submit">Save</button>}
        </form>
      </FormProvider>
    );
  };
}
