import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthProviders } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

import { Mountain } from "lucide-react";
import Link from "next/link";

import { LoginForm } from "./_forms/login-form";
import { RegisterForm } from "./_forms/register-form";

//

//     $effect(() => {
//         if ($loginMessage) {
//             if (page.status >= 200 && page.status < 300) {
//                 toast.success($loginMessage);
//             } else {
//                 toast.error($loginMessage);
//             }
//         }

//         if ($registerMessage) {
//             if (page.status >= 200 && page.status < 300) {
//                 toast.success($registerMessage);
//             } else {
//                 toast.error($registerMessage);
//             }
//         }
//     });

//     // Check if signup is enabled (or first user setup)
//     const isSignupEnabled = $derived(
//         (data.authProviders.credential?.enabled && !data.authProviders.credential?.disableSignup) ||
//             data.isFirstUser
//     );

//

// </script>

interface TabData {
  label: string;
  component: React.ReactNode;
}

export default async function Page({}: PageProps<"/auth/login">) {
  const authProviders = await getAuthProviders();

  const isFirstUser = true;
  const isSignupEnabled =
    (authProviders["credential"]?.enabled &&
      !authProviders["credential"]?.disableSignup) ||
    isFirstUser;

  const shouldRenderRegisterForm = isSignupEnabled;

  const lastLoginMethod = authClient.getLastUsedLoginMethod();

  const tabs = [
    {
      label: "Login",
      component: (
        <LoginForm
          authProviders={authProviders}
          lastLoginMethod={lastLoginMethod}
          supportsPasskey={false}
        />
      ),
    },
    ...(shouldRenderRegisterForm
      ? [{ label: "Register", component: <RegisterForm /> }]
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
        <img
          src="https://images.pexels.com/photos/114820/pexels-photo-114820.jpeg"
          alt="placeholder"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
