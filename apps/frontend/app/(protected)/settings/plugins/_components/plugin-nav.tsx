"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useId } from "react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";
import { Label } from "#components/_ui/label.tsx";
import { Switch } from "#components/_ui/switch.tsx";

import { setPluginEnabled } from "../_actions/set-plugin-enabled.action";

export interface PluginSummary {
  id: string;
  title: string;
  enabled: boolean;
  alwaysEnabled: boolean;
}

export interface PluginNavProps {
  plugins: PluginSummary[];
  /** Whether the enabled plugins are set by the environment. */
  enabledPluginsLocked: boolean;
}

/**
 * Vertical list of plugins linking to each plugin's settings, with a switch
 * for enabling or disabling each one.
 */
export function PluginNav({ plugins, enabledPluginsLocked }: PluginNavProps) {
  const activePlugin = useSelectedLayoutSegment();
  const lockedNoteId = useId();

  const { execute, optimisticState } = useOptimisticAction(setPluginEnabled, {
    currentState: plugins,
    updateFn: (state, { id, enabled }) =>
      state.map((plugin) =>
        plugin.id === id ? { ...plugin, enabled } : plugin,
      ),
    onError({ error }) {
      // `_errors` is next-safe-action's key for form-level messages
      // oxlint-disable-next-line no-underscore-dangle
      const messages = error.validationErrors?._errors ?? [];

      if (messages.length === 0) {
        toast.error(error.serverError ?? "Failed to update the plugin");
      }

      for (const message of messages) {
        toast.error(message);
      }
    },
  });

  return (
    <nav aria-label="Plugins" className="w-full md:w-60 md:shrink-0">
      <ul className="flex flex-col gap-1">
        {optimisticState.map((plugin) => {
          const isActive = plugin.id === activePlugin;
          const switchId = `plugin-enabled-${plugin.id}`;

          return (
            <li key={plugin.id} className="flex items-center gap-2">
              <Button
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className="min-w-0 flex-1 justify-start"
              >
                <Link
                  href={`/settings/plugins/${plugin.id}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="truncate">{plugin.title}</span>
                </Link>
              </Button>
              <Label htmlFor={switchId} className="sr-only">
                Enable {plugin.title}
              </Label>
              <Switch
                id={switchId}
                checked={plugin.enabled}
                disabled={plugin.alwaysEnabled || enabledPluginsLocked}
                aria-describedby={
                  enabledPluginsLocked ? lockedNoteId : undefined
                }
                onCheckedChange={(enabled) => {
                  execute({ id: plugin.id, enabled });
                }}
              />
            </li>
          );
        })}
      </ul>
      {enabledPluginsLocked && (
        <div
          id={lockedNoteId}
          className="text-muted-foreground mt-3 space-y-1 text-sm"
        >
          <p>Set by environment variable</p>
          <p>
            Enabled plugins are set by the{" "}
            <code className="font-mono text-xs">
              RIVEN_SETTING__enabledPlugins
            </code>{" "}
            environment variable, so they can&apos;t be changed here.
          </p>
        </div>
      )}
    </nav>
  );
}
