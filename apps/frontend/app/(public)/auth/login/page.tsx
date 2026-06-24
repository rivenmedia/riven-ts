import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import { authClient } from "$lib/auth-client";
import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import * as Form from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import * as Tabs from "@/components/ui/tabs";
import { createScopedLogger } from "$lib/logger";
import { doesBrowserSupportPasskeys } from "$lib/passkeys";
import { Fingerprint, Mountain, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from 'react-toastify';
// import { onMount } from "svelte";
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm} from 'react-hook-form';
import { loginSchema } from "./_form-schemas/login.schema";
import { registerSchema } from "./_forms/register.schema";
// import {
//   type Infer,
//   type SuperValidated,
//   superForm,
// } from "sveltekit-superforms";

const logger = createScopedLogger("login");

interface AuthProvider {
  enabled: boolean;
  disableSignup: boolean;
  name?: string;
  icon?: string;
}

//

//     // svelte-ignore state_referenced_locally


//     const { form: loginFormData, enhance: loginEnhance, message: loginMessage } = loginForm;
//     const {
//         form: registerFormData,
//         enhance: registerEnhance,
//         message: registerMessage
//     } = registerForm ?? { form: null, enhance: null, message: null };

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

//     async function plexLogin() {
//         await authClient.signIn.oauth2({
//             providerId: "plex",
//             callbackURL: "/"
//         });
//     }

//
//     onMount(async () => {
//         if (
//             doesBrowserSupportPasskeys() &&
//             typeof window.PublicKeyCredential.isConditionalMediationAvailable === "function"
//         ) {
//             supportsPasskeyAutofill =
//                 await window.PublicKeyCredential.isConditionalMediationAvailable();

//             if (supportsPasskeyAutofill) {
//                 void authClient.signIn.passkey({
//                     autoFill: true,
//                     fetchOptions: {
//                         async onSuccess() {
//                             await goto(resolve("/"));
//                         },
//                         onError(context) {
//                             logger.debug("Passkey autofill failed:", context.error);
//                         }
//                     }
//                 });
//             }
//         }
//     });

//     const lastLoginMethod = authClient.getLastUsedLoginMethod();
// </script>

const StarIcon = () => (
  <Star className="absolute top-0 -right-2 h-4 w-4 rotate-45 animate-pulse text-yellow-400" />
);

interface Props {
  data: {
    loginForm: SuperValidated<Infer<typeof loginSchema>>;
    registerForm: SuperValidated<Infer<typeof registerSchema>> | null;
    authProviders: Record<string, AuthProvider>;
    isFirstUser: boolean;
  };
}

export default function Page({ params }: PageProps<"/auth/login">) {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [supportsPasskeyAutofill, setSupportsPasskeyAutofill] = useState(false);
  const [supportsPasskey, setSupportsPasskey] = useState(
    doesBrowserSupportPasskeys(),
  );
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
        // resetForm: true
    });

    // svelte-ignore state_referenced_locally
    const registerForm = useForm({
      resolver: zodResolver(registerSchema),
    })


  async function handlePasskeySignIn() {
    setIsPasskeyLoading(true);

    try {
      await authClient.signIn.passkey({
        fetchOptions: {
          async onSuccess() {
            await goto(resolve("/"));
          },
          onError(context) {
            toast.error(
              context.error.message || "Passkey authentication failed",
            );
          },
        },
      });
    } catch {
      toast.error("Passkey authentication failed");
    } finally {
      setIsPasskeyLoading(false);
    }
  }

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
          <Tabs.Root bind:value={activeTab} className="w-full max-w-md">
            {isSignupEnabled && (
                    <Tabs.List className="w-full">
                        <Tabs.Trigger value="login">Login</Tabs.Trigger>
                        <Tabs.Trigger value="register">Register</Tabs.Trigger>
                    </Tabs.List>
            )}
            <Tabs.Content value="login">
              <Card.Root className="mx-auto w-full">
                <Card.Header>
                  <Card.Title className="text-2xl">Login</Card.Title>
                  <Card.Description>
                    Enter your username below to login to your account
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  {data.authProviders.credential?.enabled && (
                    <>
                              <form method="POST" use:loginEnhance action="?/login">
                                  <Form.Field form={loginForm} name="username">
                                      <Form.Control>
                                          {#snippet children({ props })}
                                              <Form.Label>Username</Form.Label>
                                              <Input
                                                  {...props}
                                                  autocomplete="username webauthn"
                                                  bind:value={$loginFormData.username} />
                                          {/snippet}
                                      </Form.Control>
                                      <Form.FieldErrors />
                                  </Form.Field>

                                  <Form.Field form={loginForm} name="password">
                                      <Form.Control>
                                          {#snippet children({ props })}
                                              <Form.Label>Password</Form.Label>
                                              <Input
                                                  {...props}
                                                  type="password"
                                                  autocomplete="current-password webauthn"
                                                  bind:value={$loginFormData.password} />
                                          {/snippet}
                                      </Form.Control>
                                      <Form.FieldErrors />
                                  </Form.Field>
                                  <Form.Button className="mt-4 w-full">Submit</Form.Button>
                              </form>
                              <div className="relative my-4">
                                  <div className="absolute inset-0 flex items-center">
                                      <span className="w-full border-t"></span>
                                  </div>
                                  <div className="relative flex justify-center text-xs uppercase">
                                      <span className="bg-card text-muted-foreground px-2">
                                          Or continue with
                                      </span>
                                  </div>
                              </div></>
                  )}

                  <div className="flex flex-col gap-2">
                    {Object.entries(data.authProviders).map(([key, provider]) => (
                      <>
                      {key !== 'credential' && provider.enabled (
<Button
                                            onClick={async () => {
                                                if (key === "plex") {
                                                    await plexLogin();
                                                } else {
                                                    await authClient.signIn.oauth2({
                                                        providerId: key,
                                                        callbackURL: "/"
                                                    });
                                                }
                                            }}
                                            variant={lastLoginMethod === key
                                                ? "secondary"
                                                : "outline"}
                                            className="relative w-full"
                                            type="button">
                                            {#if key === "plex"}
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 512 512"
                                                    className="mr-2 h-4 w-4">
                                                    <path
                                                        d="M256 70H148l108 186-108 186h108l108-186z"
                                                        fill="currentColor" />
                                                </svg>
                                            {:else if provider.icon}
                                                <img
                                                    src={provider.icon}
                                                    alt="{provider.name} icon"
                                                    className="mr-2 h-4 w-4" />
                                            {:else}
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    className="mr-2 h-4 w-4"
                                                    ><rect
                                                        width="20"
                                                        height="20"
                                                        x="2"
                                                        y="2"
                                                        rx="5"
                                                        ry="5" /><path
                                                        d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line
                                                        x1="17.5"
                                                        x2="17.51"
                                                        y1="6.5"
                                                        y2="6.5" /></svg>
                                            {/if}
                                            Login with {provider.name ||
                                                key.charAt(0).toUpperCase() + key.slice(1)}
                                            {#if lastLoginMethod === key}
                                                {@render star()}
                                            {/if}
                                        </Button>
                      )}
                      </>
                    ))}

                    {supportsPasskey && (

                                    <Button
                                        variant={lastLoginMethod === "passkey"
                                            ? "secondary"
                                            : "outline"}
                                        className="relative w-full"
                                        disabled={isPasskeyLoading}
                                        onclick={handlePasskeySignIn}
                                        type="button">
                                        <Fingerprint className="mr-2 h-4 w-4" />
                                        {isPasskeyLoading
                                            ? "Authenticating..."
                                            : "Sign in with Passkey"}

                                        {#if lastLoginMethod === "passkey"}
                                            {@render star()}
                                        {/if}
                                    </Button>
                    )}
                            </div>
                </Card.Content>
              </Card.Root>
            </Tabs.Content>
            {isSignupEnabled && registerForm && registerEnhance && $registerFormData && (
<Tabs.Content value="register">

                    </Tabs.Content>
)
            }
          </Tabs.Root>
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
