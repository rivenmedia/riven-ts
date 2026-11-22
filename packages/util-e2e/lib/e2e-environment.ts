export interface E2eEnvironmentInput {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  vfsMountPath: string;
  apiKey: string;
  origin: string;
  /** The plugins Riven enables, without the `@repo/plugin-` prefix */
  enabledPlugins: readonly string[];
}

const pluginHost = (plugin: string) => `http://${plugin}.e2e.invalid`;
const pluginKey = (plugin: string) => `e2e-${plugin}-key`;

/**
 * The settings every core plugin needs to be valid, derived from each plugin's `settingsSchema`.
 * Required settings come first. The rest stop plugins from defaulting to a real host.
 * Environment values for non-string settings are parsed as JSON.
 */
const pluginSettings = {
  COMET: { url: pluginHost("comet") },
  JELLYFIN: {
    jellyfinToken: pluginKey("jellyfin"),
    jellyfinServerUrl: pluginHost("jellyfin"),
  },
  LISTRR: { apiKey: pluginKey("listrr") },
  MDBLIST: { apiKey: pluginKey("mdblist") },
  NOTIFICATIONS: {
    urls: JSON.stringify(["json://notifications.e2e.invalid/hook"]),
  },
  PLEX: {
    plexToken: pluginKey("plex"),
    plexServerUrl: pluginHost("plex"),
  },
  SEERR: { apiKey: pluginKey("seerr"), url: pluginHost("seerr") },
  SILO: {
    // Silo rejects any key that doesn't start with `sa_`
    siloApiKey: `sa_${pluginKey("silo")}`,
    siloServerUrl: pluginHost("silo"),
  },
  STREMTHRU: {
    stremThruUrl: pluginHost("stremthru"),
    // StremThru's torz source is only valid with at least one store key
    torboxApiKey: pluginKey("stremthru"),
  },
  SUBDL: { apiKey: pluginKey("subdl") },
} as const satisfies Record<string, Record<string, string>>;

/**
 * The environment every E2E Riven boots with: the baseline scenario, the given plugins enabled,
 * and every external service pointed at an `.invalid` host, so a leaked request fails DNS resolution.
 */
export function createE2eEnvironment({
  port,
  databaseUrl,
  redisUrl,
  vfsMountPath,
  apiKey,
  origin,
  enabledPlugins,
}: E2eEnvironmentInput) {
  const environment: Record<string, string> = {
    NODE_ENV: "test",
    MOCK_SCENARIO: "e2e-baseline",
    RIVEN_SETTING__host: "127.0.0.1",
    RIVEN_SETTING__port: port.toString(),
    RIVEN_SETTING__databaseUrl: databaseUrl,
    RIVEN_SETTING__redisUrl: redisUrl,
    RIVEN_SETTING__vfsMountPath: vfsMountPath,
    RIVEN_SETTING__apiKey: apiKey,
    RIVEN_SETTING__unsafeWipeUsersOnStartup: "true",
    RIVEN_SETTING__shutdownTimeoutSeconds: "10",
    RIVEN_SETTING__enabledPlugins: JSON.stringify(enabledPlugins),
    // Points at a file that never exists, so resetting doesn't re-import the repo's ranking config
    RIVEN_SETTING__rankingConfigPath: `${vfsMountPath}.ranking-config.json`,
    // Logs only go to stdout, which the E2E fixture writes to its own file. That keeps instances out of the repo's log
    // directory, and stops the file transport's exception handler swallowing errors thrown during boot.
    RIVEN_SETTING__enabledLogTransports: JSON.stringify(["console"]),
    // The ECS log files are always written, whichever transports are enabled
    RIVEN_SETTING__logDirectory: `${vfsMountPath}.logs`,
    RIVEN_FRONTEND_SETTING__origin: origin,
    RIVEN_FRONTEND_SETTING__authSecret: "e2e-auth-secret-0123456789abcdef0123",
    RIVEN_FRONTEND_SETTING__passkeyRpId: "localhost",
    RIVEN_FRONTEND_SETTING__disablePlex: "true",
  };

  for (const [plugin, settings] of Object.entries(pluginSettings)) {
    for (const [setting, value] of Object.entries(settings)) {
      environment[`RIVEN_PLUGIN_SETTING__REPO_PLUGIN_${plugin}__${setting}`] =
        value;
    }
  }

  return environment;
}
