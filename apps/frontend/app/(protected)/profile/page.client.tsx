import { DateTime } from "luxon";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "#components/_ui/avatar.tsx";
import { Badge } from "#components/_ui/badge.tsx";
import { Separator } from "#components/_ui/separator.tsx";
import { AccountLinks } from "#components/auth/account-links/account-links.tsx";
import { ChangeEmailForm } from "#components/auth/change-email-form/change-email-form.tsx";
import { CreateUserForm } from "#components/auth/create-user-form/create-user-form.tsx";
import { PasskeyFormProvider } from "#components/auth/passkeys/passkey-form-provider.tsx";
import { Passkeys } from "#components/auth/passkeys/passkeys.tsx";
import { PasswordChangeForm } from "#components/auth/password-change-form/password-change-form.tsx";
import { SetPasswordForm } from "#components/auth/set-password-form/set-password-form.tsx";
import { UpdateProfileForm } from "#components/auth/update-profile-form/update-profile-form.tsx";
import { UserManagement } from "#components/auth/user-management/user-management.tsx";
import { getInitials } from "#lib/utils.ts";

import { DeleteAccountConfirmationDialog } from "./_components/delete-account-confirmation-dialog/delete-account-confirmation-dialog";
import { LogoutButton } from "./_components/logout-button/logout-button";

import type { AuthProvider } from "#app/_types/__generated__/graphql.ts";
import type { User } from "#lib/auth/client.ts";
import type { Account } from "better-auth";

interface ProfilePageProps {
  accounts: Account[];
  hasCredentialProvider: boolean;
  canManageUsers: boolean;
  user: User;
  users: User[];
  providers: Record<string, AuthProvider>;
}

/**
 * Profile route with account settings, security options, linked accounts and
 * admin user management.
 */
export function ProfilePage({
  accounts,
  hasCredentialProvider,
  canManageUsers,
  user,
  users,
  providers,
}: ProfilePageProps) {
  return (
    <>
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
          <LogoutButton />
          <DeleteAccountConfirmationDialog />
        </div>
      </section>

      {hasCredentialProvider ? <PasswordChangeForm /> : <SetPasswordForm />}
      <Separator />
      <ChangeEmailForm />
      <Separator />
      <UpdateProfileForm
        data={{
          avatar: user.image ?? "",
          name: user.name,
          username: user.username ?? "",
        }}
      />
      <Separator />
      {canManageUsers && (
        <>
          <CreateUserForm />
          <Separator />
          <UserManagement currentUserId={user.id} users={users} />
          <Separator />
        </>
      )}
      <AccountLinks accounts={accounts} providers={providers} />
      <Separator />
      <PasskeyFormProvider>
        <Passkeys />
      </PasskeyFormProvider>
    </>
  );
}
