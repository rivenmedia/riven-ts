"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#components/_ui/alert-dialog.tsx";
import { Button } from "#components/_ui/button.tsx";

import { SettingsPasswordField } from "./password-field.tsx";

import type { SecretState } from "#app/_types/__generated__/graphql.ts";
import type { CommonSettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsSecretFieldProps extends CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
  secretState?: SecretState;
  onReset?: () => void;
}

const placeholders = {
  default: "Using default value",
  custom: "Custom value set — type to replace",
  env: "Set by environment variable",
  unset: "Not set",
} as const satisfies Record<SecretState, string>;

/**
 * Write-only secret input. The stored value is never shown; the placeholder
 * reflects where the current value comes from, and a custom value can be
 * reset back to its default.
 */
export function SettingsSecretField({
  secretState = "unset",
  onReset,
  ...props
}: SettingsSecretFieldProps) {
  return (
    <div className="space-y-2">
      <SettingsPasswordField
        {...props}
        placeholder={placeholders[secretState]}
      />
      {secretState === "custom" && onReset && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset to default?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the custom value for {props.label} and falls back
                to the default.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
