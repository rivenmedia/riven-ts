import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { query } from "@/lib/graphql/client";

import { Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "./_forms/login-form";
import { RegisterForm } from "./_forms/register-form";
import { GET_AUTH_PROVIDERS } from "./_queries/get-auth-providers.query";

interface TabData {
  label: string;
  component: React.ReactNode;
}

export default async function Page() {
  const { data } = await query({
    query: GET_AUTH_PROVIDERS,
  });

  if (!data) {
    throw new Error("Failed to fetch auth providers");
  }

  const { authProviders } = data;

  const credentialProvider = authProviders.find(
    ({ key }) => key === "credential",
  );

  const isCredentialProviderEnabled =
    (credentialProvider?.enabled && !credentialProvider.disableSignup) ?? false;

  const lastLoginMethod = authClient.getLastUsedLoginMethod();

  const tabs = [
    {
      label: "Login",
      component: (
        <LoginForm
          authProviders={authProviders}
          lastLoginMethod={lastLoginMethod}
          isCredentialProviderEnabled={isCredentialProviderEnabled}
        />
      ),
    },
    ...(isCredentialProviderEnabled
      ? [
          {
            label: "Register",
            component: <RegisterForm isSignupEnabled />,
          },
        ]
      : []),
  ] as const satisfies readonly TabData[];

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Mountain className="size-4" />
            </div>
            Riven Media
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Tabs
            defaultValue={tabs[0].label.toLowerCase()}
            className="w-full max-w-md"
          >
            {tabs.length > 1 && (
              <TabsList className="w-full">
                {tabs.map(({ label }) => (
                  <TabsTrigger key={label} value={label.toLowerCase()}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            {tabs.map(({ label, component }) => (
              <TabsContent key={label} value={label.toLowerCase()}>
                {component}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          loading="eager"
          src="https://images.pexels.com/photos/114820/pexels-photo-114820.jpeg"
          alt="placeholder"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          height="3376"
          width="6000"
        />
      </div>
    </div>
  );
}
