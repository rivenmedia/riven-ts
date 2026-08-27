import { Avatar, AvatarFallback, AvatarImage } from "@/components/_ui/avatar";
import { Badge } from "@/components/_ui/badge";
import { Button } from "@/components/_ui/button";
import { AccountLinks } from "@/components/auth/account-links/account-links";
import { CreateUserForm } from "@/components/auth/create-user-form/create-user-form";
import { EmailChangeForm } from "@/components/auth/email-change-form/email-change-form";
import { PasskeyFormProvider } from "@/components/auth/passkeys/passkey-form-provider";
import { Passkeys } from "@/components/auth/passkeys/passkeys";
import { PasswordChangeForm } from "@/components/auth/password-change-form/password-change-form";
import { SetPasswordForm } from "@/components/auth/set-password-form/set-password-form";
import { UpdateProfileForm } from "@/components/auth/update-profile-form/update-profile-form";
import { UserManagement } from "@/components/auth/user-management/user-management";
import { PageShell } from "@/components/page-shell/page-shell";
import { authClient } from "@/lib/auth/client";
import { getInitials } from "@/lib/utils";

import { DateTime } from "luxon";
import { useRouter } from "next/navigation";

import type { User } from "@/lib/auth/client";

interface ProfilePageProps {
  hasCredentialProvider: boolean;
  canManageUsers: boolean;
  user: User;
}

export function ProfilePage({
  hasCredentialProvider,
  canManageUsers,
  user,
}: ProfilePageProps) {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  }

  async function handleDeleteAccount() {
    await authClient.deleteUser({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  }

  return (
    <PageShell className="mx-auto w-full max-w-5xl">
      <section className="border-border/60 flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 text-xl">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.name}&apos;s Profile
              </h1>
              <Badge variant="secondary" className="capitalize">
                Role: {user.role}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm break-all">
              {user.email}
            </p>

            <dl className="text-muted-foreground mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt>Member since</dt>
                <dd className="text-foreground">
                  {DateTime.fromJSDate(user.createdAt).toLocaleString(
                    DateTime.DATE_FULL,
                  )}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>Last updated</dt>
                <dd className="text-foreground">
                  {DateTime.fromJSDate(user.updatedAt).toLocaleString(
                    DateTime.DATE_FULL,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              void handleLogout();
            }}
            type="button"
          >
            Logout
          </Button>

          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => {
              void handleDeleteAccount();
            }}
            type="button"
          >
            Delete Account
          </Button>
        </div>
      </section>
      {hasCredentialProvider ? <PasswordChangeForm /> : <SetPasswordForm />}
      <EmailChangeForm />
      <UpdateProfileForm
        data={{
          avatar: user.image ?? "",
          name: user.name,
          username: user.username ?? "",
        }}
      />
      {canManageUsers && (
        <>
          <CreateUserForm />
          <UserManagement currentUserId={user.id} users={[]} />
        </>
      )}
      <AccountLinks accounts={[]} providers={{}} />
      <PasskeyFormProvider>
        <Passkeys />
      </PasskeyFormProvider>
    </PageShell>
  );
}
