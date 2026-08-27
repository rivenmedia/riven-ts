import { Badge } from "@/components/_ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/_ui/table";
import { authClient } from "@/lib/auth/client";

import { DateTime } from "luxon";

import { FormBase } from "../form-base/form-base";
import { DeleteUserConfirmationDialog } from "./components/delete-user-confirmation-dialog";

import type { User } from "@/lib/auth/client";

export interface UserManagementProps {
  users: User[];
}

export function UserManagement({ users }: UserManagementProps) {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  const currentUserId = data?.user.id;

  if (!currentUserId) {
    throw new Error(
      "UserManagement component must be used within a session context. No current user found.",
    );
  }

  return (
    <FormBase
      title="User Management"
      description="Manage existing users in the system."
      content={
        <div className="border-border/60 mt-6 overflow-x-auto border-y">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    aria-labelledby={`user-${user.email}`}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {user.username ?? user.name}
                      </div>
                      <div
                        className="text-muted-foreground text-xs"
                        id={`user-${user.email}`}
                      >
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {user.role ?? "user"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {DateTime.fromJSDate(user.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentUserId !== user.id && (
                        <DeleteUserConfirmationDialog user={user} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      }
    />
  );
}
