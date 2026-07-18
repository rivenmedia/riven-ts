"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { FormProvider } from "react-hook-form";
import z from "zod";

import { finishSetup } from "./_actions/finish-setup.action";

const formSchema = z.object({
  test: z.string().optional(),
});

export default function SetupLayout({ children }: LayoutProps<"/setup">) {
  const { handleSubmitWithAction, form } = useHookFormAction(
    finishSetup,
    zodResolver(formSchema),
    {
      formProps: {
        shouldUnregister: false,
      },
    },
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => void handleSubmitWithAction(e)}>{children}</form>
    </FormProvider>
  );
}
