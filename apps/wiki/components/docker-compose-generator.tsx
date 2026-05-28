"use client";

import { Check, Copy, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { stringify } from "yaml";

type MediaServer = "none" | "plex" | "jellyfin" | "emby";
type RivenVersion = "ts" | "v1";

interface TSConfig {
  vfsMountPath: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  mediaServer: MediaServer;
  // Plugin settings
  tmdbApiKey: string;
  debridProvider: "realdebrid" | "alldebrid" | "torbox" | "none";
  debridApiKey: string;
  contentSource: "mdblist" | "seerr" | "listrr" | "none";
  contentApiKey: string;
  contentLists: string;
  seerrUrl: string;
  addAnalyticsServices: boolean;
  logsPath: string;
}

interface V1Config {
  timezone: string;
  puid: string;
  pgid: string;
  frontendPort: string;
  backendPort: string;
  originUrl: string;
  hostMountPath: string;
  mediaServer: MediaServer;
  backendApiKey: string;
  authSecret: string;
  dbPassword: string;
}

interface DockerService {
  image: string;
  container_name: string;
  command?: string;
  restart?: string;
  shm_size?: string;
  ports?: string[];
  tty?: boolean;
  cap_add?: string[];
  security_opt?: string[];
  devices?: string[];
  environment?: string[] | Record<string, string>;
  env_file?: string;
  depends_on?: Record<string, { condition: string }>;
  volumes?: (
    | string
    | {
        type: string;
        source: string;
        target: string;
        read_only?: boolean;
        bind?: { propagation: string };
      }
  )[];
  healthcheck?: {
    test: string | string[];
    start_period?: string;
    interval: string;
    timeout?: string;
    retries?: number;
  };
}

interface DockerCompose {
  volumes: Record<string, null>;
  services: Record<string, DockerService>;
}

// --- Riven TS Service Builders ---

function buildTSCompose(cfg: TSConfig): {
  compose: string;
  env: string;
  systemd: string;
} {
  const compose: DockerCompose = {
    volumes: {
      postgres_data: null,
      redis_data: null,
    },
    services: {
      riven: {
        image: "ghcr.io/rivenmedia/riven-ts:main",
        container_name: "riven",
        restart: "unless-stopped",
        tty: true,
        cap_add: ["SYS_ADMIN"],
        security_opt: ["apparmor:unconfined"],
        devices: ["/dev/fuse"],
        env_file: ".env",
        volumes: [
          `${cfg.logsPath}:/app/logs`,
          `${cfg.vfsMountPath}:/mount:rshared,z`,
        ],
        depends_on: {
          postgres: { condition: "service_healthy" },
          redis: { condition: "service_healthy" },
        },
      },
      postgres: {
        image: "postgres:17-alpine",
        container_name: "riven-postgres",
        restart: "unless-stopped",
        environment: {
          POSTGRES_USER: cfg.dbUser || "riven",
          POSTGRES_PASSWORD: cfg.dbPassword || "changeme",
          POSTGRES_DB: cfg.dbName || "riven",
        },
        volumes: ["postgres_data:/var/lib/postgresql/data"],
        healthcheck: {
          test: ["CMD-SHELL", `pg_isready -U ${cfg.dbUser || "riven"}`],
          interval: "5s",
          timeout: "5s",
          retries: 5,
        },
      },
      redis: {
        image: "redis:8-alpine",
        container_name: "riven-redis",
        restart: "unless-stopped",
        command: "redis-server --maxmemory-policy noeviction --appendonly yes",
        volumes: ["redis_data:/data"],
        healthcheck: {
          test: ["CMD-SHELL", "redis-cli ping | grep PONG"],
          interval: "5s",
          timeout: "5s",
          retries: 5,
        },
      },
      ...(cfg.addAnalyticsServices && {
        bullboard: {
          container_name: "bullboard",
          image: "venatum/bull-board:latest",
          restart: "unless-stopped",
          ports: ["4000:4000"],
          environment: {
            PORT: "4000",
            REDIS_HOST: "redis",
          },
          depends_on: {
            redis: {
              condition: "service_healthy",
            },
          },
        },
        "redis-insight": {
          container_name: "redis-insight",
          image: "redislabs/redisinsight:latest",
          restart: "unless-stopped",
          environment: {
            RI_REDIS_HOST: "redis",
          },
          ports: ["5540:5540"],
          healthcheck: {
            test: [
              "CMD-SHELL",
              "wget --no-verbose --tries=1 --spider http://localhost:5540/api/health || exit 1",
            ],
            start_period: "20s",
            timeout: "3s",
            interval: "15s",
            retries: 3,
          },
          depends_on: {
            redis: { condition: "service_healthy" },
          },
        },
      }),
    },
  };

  // Media server
  if (cfg.mediaServer !== "none") {
    addMediaServer(compose, cfg.mediaServer, cfg.vfsMountPath);
  }

  const composeStr = stringify(compose, { lineWidth: 0, nullStr: "" });

  // .env file
  const envLines: string[] = [
    "# Core Settings",
    `RIVEN_SETTING__databaseUrl="postgres+psycopg2://${cfg.dbUser || "riven"}:${cfg.dbPassword || "changeme"}@postgres:5432/${cfg.dbName || "riven"}"`,
    `RIVEN_SETTING__redisUrl="redis://redis:6379"`,
    `RIVEN_SETTING__vfsMountPath="/mount"`,
    `RIVEN_SETTING__logLevel="info"`,
    `RIVEN_SETTING__enabledLogTransports=["console"]`,
    "",
  ];

  if (cfg.tmdbApiKey) {
    envLines.push("# TMDB (required)");
    envLines.push(
      `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_TMDB__apiKey="${cfg.tmdbApiKey}"`,
    );
    envLines.push("");
  }

  if (cfg.debridProvider !== "none" && cfg.debridApiKey) {
    envLines.push("# Debrid Provider (via StremThru)");
    envLines.push(
      `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_STREMTHRU__${cfg.debridProvider}ApiKey="${cfg.debridApiKey}"`,
    );
    envLines.push("");
  }

  if (cfg.contentSource === "mdblist" && cfg.contentApiKey) {
    envLines.push("# MDBList");
    envLines.push(
      `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_MDBLIST__apiKey="${cfg.contentApiKey}"`,
    );

    if (cfg.contentLists) {
      const lists = cfg.contentLists.split(",").map((l) => `"${l.trim()}"`);
      envLines.push(
        `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_MDBLIST__lists=[${lists.join(",")}]`,
      );
    }

    envLines.push("");
  } else if (cfg.contentSource === "seerr" && cfg.contentApiKey) {
    envLines.push("# Seerr");
    envLines.push(
      `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_SEERR__apiKey="${cfg.contentApiKey}"`,
    );

    if (cfg.seerrUrl) {
      envLines.push(
        `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_SEERR__url="${cfg.seerrUrl}"`,
      );
    }

    envLines.push("");
  } else if (cfg.contentSource === "listrr" && cfg.contentApiKey) {
    envLines.push("# Listrr");
    envLines.push(
      `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_LISTRR__apiKey="${cfg.contentApiKey}"`,
    );

    if (cfg.contentLists) {
      const lists = cfg.contentLists.split(",").map((l) => `"${l.trim()}"`);
      envLines.push(
        `RIVEN_PLUGIN_SETTING__REPO_PLUGIN_LISTRR__movieLists=[${lists.join(",")}]`,
      );
    }

    envLines.push("");
  }

  const envStr = envLines.join("\n");

  const systemd = buildSystemdService(cfg.vfsMountPath);

  return { compose: composeStr, env: envStr, systemd };
}

// --- Legacy V1 Service Builders ---

function buildV1Compose(cfg: V1Config): { compose: string; systemd: string } {
  const compose: DockerCompose = {
    volumes: {
      "riven-frontend-data": null,
      "riven-pg-data": null,
    },
    services: {
      "riven-frontend": {
        image: "spoked/riven-frontend:dev",
        container_name: "riven-frontend",
        restart: "unless-stopped",
        ports: [`${cfg.frontendPort}:3000`],
        environment: [
          `TZ=${cfg.timezone}`,
          "DATABASE_URL=/riven/data/riven.db",
          "BACKEND_URL=http://riven:8080",
          `BACKEND_API_KEY=${cfg.backendApiKey || "CHANGE_ME"}`,
          `AUTH_SECRET=${cfg.authSecret || "CHANGE_ME"}`,
          `ORIGIN=${cfg.originUrl}`,
        ],
        depends_on: {
          riven: { condition: "service_healthy" },
        },
        volumes: ["riven-frontend-data:/riven/data"],
      },
      riven: {
        image: "spoked/riven:dev",
        container_name: "riven",
        restart: "unless-stopped",
        shm_size: "1024m",
        ports: [`${cfg.backendPort}:8080`],
        tty: true,
        cap_add: ["SYS_ADMIN"],
        security_opt: ["apparmor:unconfined"],
        devices: ["/dev/fuse"],
        environment: [
          `PUID=${cfg.puid}`,
          `PGID=${cfg.pgid}`,
          `TZ=${cfg.timezone}`,
          "RIVEN_FORCE_ENV=true",
          `RIVEN_API_KEY=${cfg.backendApiKey || "CHANGE_ME"}`,
          `RIVEN_DATABASE_HOST=postgresql+psycopg2://postgres:${cfg.dbPassword || "CHANGE_ME"}@riven-db:5432/riven`,
          "RIVEN_FILESYSTEM_MOUNT_PATH=/mount",
          `RIVEN_UPDATERS_LIBRARY_PATH=${cfg.hostMountPath}`,
        ],
        healthcheck: {
          test: "curl -s http://localhost:8080 >/dev/null || exit 1",
          interval: "30s",
          timeout: "10s",
          retries: 10,
        },
        volumes: [
          "./data:/riven/data",
          `${cfg.hostMountPath}:/mount:rshared,z`,
        ],
        depends_on: {
          "riven-db": { condition: "service_healthy" },
        },
      },
      "riven-db": {
        image: "postgres:17-alpine",
        container_name: "riven-db",
        environment: {
          PGDATA: "/var/lib/postgresql/data/pgdata",
          POSTGRES_USER: "postgres",
          POSTGRES_PASSWORD: cfg.dbPassword || "CHANGE_ME",
          POSTGRES_DB: "riven",
        },
        volumes: ["riven-pg-data:/var/lib/postgresql/data/pgdata"],
        healthcheck: {
          test: ["CMD-SHELL", "pg_isready -U postgres"],
          interval: "10s",
          timeout: "5s",
          retries: 5,
        },
      },
    },
  };

  if (cfg.mediaServer !== "none") {
    addMediaServer(compose, cfg.mediaServer, cfg.hostMountPath);
  }

  return {
    compose: stringify(compose, { lineWidth: 0, nullStr: "" }),
    systemd: buildSystemdService(cfg.hostMountPath),
  };
}

// --- Shared ---

function addMediaServer(
  compose: DockerCompose,
  server: Exclude<MediaServer, "none">,
  mountPath: string,
) {
  if (server === "plex") {
    compose.services["plex"] = {
      image: "plexinc/pms-docker:latest",
      container_name: "plex",
      restart: "unless-stopped",
      ports: ["32400:32400"],
      environment: ["TZ=UTC", "VERSION=docker"],
      volumes: ["plex-config:/config", `${mountPath}:/mount:rslave,z`],
    };
    compose.volumes["plex-config"] = null;
  } else if (server === "jellyfin") {
    compose.services["jellyfin"] = {
      image: "jellyfin/jellyfin:latest",
      container_name: "jellyfin",
      restart: "unless-stopped",
      ports: ["8096:8096"],
      volumes: [
        "jellyfin-config:/config",
        "jellyfin-cache:/cache",
        `${mountPath}:/mount:rslave,z`,
      ],
    };
    compose.volumes["jellyfin-config"] = null;
    compose.volumes["jellyfin-cache"] = null;
  } else {
    compose.services["emby"] = {
      image: "emby/embyserver:latest",
      container_name: "emby",
      restart: "unless-stopped",
      ports: ["8096:8096"],
      volumes: ["emby-config:/config", `${mountPath}:/mount:rslave,z`],
    };
    compose.volumes["emby-config"] = null;
  }
}

function buildSystemdService(mountPath: string) {
  return `[Unit]
Description=Make Riven data bind mount shared
After=local-fs.target
Before=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/mount --bind ${mountPath} ${mountPath}
ExecStart=/usr/bin/mount --make-rshared ${mountPath}
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target`;
}

function generateSecret(
  length: number,
  format: "hex" | "base64" = "hex",
): string {
  const bytes = format === "base64" ? length : Math.ceil(length / 2);
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  if (format === "base64") {
    return btoa(String.fromCharCode(...array));
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

// --- Components ---

function InputField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-fd-border bg-fd-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${mono ? "font-mono text-xs" : ""}`}
      />
      {hint && <p className="mt-1 text-xs text-fd-muted-foreground">{hint}</p>}
    </div>
  );
}

function CheckboxField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium inline-block">
        <input
          className="accent-purple-500"
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => {
            onChange(e.target.checked ? "true" : "false");
          }}
        />
        <span className="ml-2">{label}</span>
      </label>
      {hint && <p className="mt-1 text-xs text-fd-muted-foreground">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className="w-full rounded-lg border border-fd-border bg-fd-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CodePreview({
  code,
  language,
  label,
  filename,
}: {
  code: string;
  language: string;
  label: string;
  filename: string;
}) {
  const [highlighted, setHighlighted] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void codeToHtml(code, { lang: language, theme: "github-dark" }).then(
      setHighlighted,
    );
  }, [code, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{label}</h4>
        <div className="flex gap-2">
          <button
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fd-muted/50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>
      </div>
      <div
        className="max-h-[75vh] overflow-auto rounded-lg border border-fd-border text-xs [&_pre]:m-0! [&_pre]:bg-transparent! [&_pre]:py-3"
        dangerouslySetInnerHTML={{
          __html: highlighted || "<pre><code>Loading...</code></pre>",
        }}
      />
    </div>
  );
}

// --- Main Component ---

export default function DockerComposeGenerator() {
  const [version, setVersion] = useState<RivenVersion>("ts");

  // TS config
  const [tsConfig, setTSConfig] = useState<TSConfig>({
    vfsMountPath: "/mnt/riven",
    logsPath: "./logs",
    dbUser: "riven",
    dbPassword: "",
    dbName: "riven",
    mediaServer: "none",
    tmdbApiKey: "",
    debridProvider: "realdebrid",
    debridApiKey: "",
    contentSource: "mdblist",
    contentApiKey: "",
    contentLists: "",
    seerrUrl: "http://seerr:5055",
    addAnalyticsServices: false,
  });

  // V1 config
  const [v1Config, setV1Config] = useState<V1Config>({
    timezone: "UTC",
    puid: "1000",
    pgid: "1000",
    frontendPort: "3000",
    backendPort: "8080",
    originUrl: "http://localhost:3000",
    hostMountPath: "/mnt/riven",
    mediaServer: "none",
    backendApiKey: "",
    authSecret: "",
    dbPassword: "",
  });

  const updateTS = <K extends keyof TSConfig>(key: K, value: TSConfig[K]) => {
    setTSConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateV1 = <K extends keyof V1Config>(key: K, value: V1Config[K]) => {
    setV1Config((prev) => ({ ...prev, [key]: value }));
  };

  const tsOutput = useCallback(() => buildTSCompose(tsConfig), [tsConfig]);
  const v1Output = useCallback(() => buildV1Compose(v1Config), [v1Config]);

  return (
    <div className="space-y-6">
      {/* Version Tabs */}
      <div className="flex gap-1 rounded-lg border border-fd-border bg-fd-muted/30 p-1">
        <button
          onClick={() => {
            setVersion("ts");
          }}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            version === "ts"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-fd-muted-foreground hover:text-fd-foreground"
          }`}
        >
          Riven TS (Recommended)
        </button>
        <button
          onClick={() => {
            setVersion("v1");
          }}
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            version === "v1"
              ? "bg-fd-muted text-fd-foreground shadow-sm"
              : "text-fd-muted-foreground hover:text-fd-foreground"
          }`}
        >
          Legacy v1
        </button>
      </div>

      {version === "v1" && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            Riven v1 is in maintenance mode and will not receive new features.
            Consider using Riven TS instead.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Config Form */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Configuration</h3>

          {version === "ts" ? (
            <TSConfigForm config={tsConfig} update={updateTS} />
          ) : (
            <V1ConfigForm config={v1Config} update={updateV1} />
          )}
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Generated Files</h3>

          {version === "ts" ? (
            <TSPreview output={tsOutput()} />
          ) : (
            <V1Preview output={v1Output()} />
          )}
        </div>
      </div>
    </div>
  );
}

function TSConfigForm({
  config,
  update,
}: {
  config: TSConfig;
  update: <K extends keyof TSConfig>(key: K, value: TSConfig[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <InputField
        label="VFS Mount Path"
        value={config.vfsMountPath}
        onChange={(v) => {
          update("vfsMountPath", v);
        }}
        placeholder="/mnt/riven"
        hint="Absolute path on your host for the FUSE mount"
      />

      <InputField
        label="Logs Path"
        value={config.logsPath}
        onChange={(v) => {
          update("logsPath", v);
        }}
        placeholder="logs"
        hint="Absolute path on your host for the logs"
      />

      <div className="grid grid-cols-3 gap-4">
        <InputField
          label="DB User"
          value={config.dbUser}
          onChange={(v) => {
            update("dbUser", v);
          }}
          placeholder="riven"
        />
        <InputField
          label="DB Password"
          value={config.dbPassword}
          onChange={(v) => {
            update("dbPassword", v);
          }}
          placeholder="changeme"
          mono
        />
        <InputField
          label="DB Name"
          value={config.dbName}
          onChange={(v) => {
            update("dbName", v);
          }}
          placeholder="riven"
        />
      </div>

      <button
        onClick={() => {
          update("dbPassword", generateSecret(24));
        }}
        className="rounded-md bg-fd-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-fd-muted/80"
      >
        Generate DB Password
      </button>

      <SelectField
        label="Media Server"
        value={config.mediaServer}
        onChange={(v) => {
          update("mediaServer", v as MediaServer);
        }}
        options={[
          { value: "none", label: "None (I'll add it later)" },
          { value: "plex", label: "Plex" },
          { value: "jellyfin", label: "Jellyfin" },
          { value: "emby", label: "Emby" },
        ]}
      />

      <hr className="border-fd-border" />
      <h4 className="font-semibold">Plugin Settings</h4>

      <InputField
        label="TMDB API Key (required)"
        value={config.tmdbApiKey}
        onChange={(v) => {
          update("tmdbApiKey", v);
        }}
        placeholder="Your TMDB API key"
        hint="Get one free at themoviedb.org/settings/api"
        mono
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Debrid Provider"
          value={config.debridProvider}
          onChange={(v) => {
            update("debridProvider", v as TSConfig["debridProvider"]);
          }}
          options={[
            { value: "realdebrid", label: "Real-Debrid" },
            { value: "alldebrid", label: "AllDebrid" },
            { value: "torbox", label: "TorBox" },
            { value: "none", label: "None" },
          ]}
        />
        {config.debridProvider !== "none" && (
          <InputField
            label="Debrid API Key"
            value={config.debridApiKey}
            onChange={(v) => {
              update("debridApiKey", v);
            }}
            placeholder="Your debrid API key"
            mono
          />
        )}
      </div>

      <SelectField
        label="Content Source"
        value={config.contentSource}
        onChange={(v) => {
          update("contentSource", v as TSConfig["contentSource"]);
        }}
        options={[
          { value: "mdblist", label: "MDBList" },
          { value: "seerr", label: "Seerr" },
          { value: "listrr", label: "Listrr" },
          { value: "none", label: "None" },
        ]}
      />

      {config.contentSource !== "none" && (
        <>
          <InputField
            label={`${config.contentSource === "mdblist" ? "MDBList" : config.contentSource === "seerr" ? "Seerr" : "Listrr"} API Key`}
            value={config.contentApiKey}
            onChange={(v) => {
              update("contentApiKey", v);
            }}
            placeholder="API key"
            mono
          />
          {config.contentSource === "seerr" && (
            <InputField
              label="Seerr URL"
              value={config.seerrUrl}
              onChange={(v) => {
                update("seerrUrl", v);
              }}
              placeholder="http://seerr:5055"
            />
          )}
          {(config.contentSource === "mdblist" ||
            config.contentSource === "listrr") && (
            <InputField
              label="Lists (comma-separated)"
              value={config.contentLists}
              onChange={(v) => {
                update("contentLists", v);
              }}
              placeholder="user/list-name, user/another-list"
              hint={
                config.contentSource === "mdblist"
                  ? 'MDBList list slugs, e.g. "user/my-list"'
                  : "Listrr list IDs"
              }
            />
          )}
        </>
      )}

      <CheckboxField
        label="Add analytics services?"
        hint="Adds analytics services for monitoring Riven's internal queues and cache. Recommended for advanced users. No data is sent to third parties - these are self-hosted services that connect directly to your Riven instance."
        value={config.addAnalyticsServices ? "true" : "false"}
        onChange={(v) => {
          update("addAnalyticsServices", v === "true");
        }}
      />
    </div>
  );
}

function V1ConfigForm({
  config,
  update,
}: {
  config: V1Config;
  update: <K extends keyof V1Config>(key: K, value: V1Config[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <InputField
        label="Timezone"
        value={config.timezone}
        onChange={(v) => {
          update("timezone", v);
        }}
        placeholder="Europe/UTC"
        hint="e.g., America/New_York, Europe/Zurich"
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="PUID"
          value={config.puid}
          onChange={(v) => {
            update("puid", v);
          }}
          type="number"
        />
        <InputField
          label="PGID"
          value={config.pgid}
          onChange={(v) => {
            update("pgid", v);
          }}
          type="number"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Frontend Port"
          value={config.frontendPort}
          onChange={(v) => {
            update("frontendPort", v);
          }}
          type="number"
        />
        <InputField
          label="Backend Port"
          value={config.backendPort}
          onChange={(v) => {
            update("backendPort", v);
          }}
          type="number"
        />
      </div>

      <InputField
        label="Origin URL"
        value={config.originUrl}
        onChange={(v) => {
          update("originUrl", v);
        }}
        placeholder="http://localhost:3000"
        hint="The URL where you'll access the frontend"
      />

      <InputField
        label="Host Mount Path"
        value={config.hostMountPath}
        onChange={(v) => {
          update("hostMountPath", v);
        }}
        placeholder="/mnt/riven"
      />

      <SelectField
        label="Media Server"
        value={config.mediaServer}
        onChange={(v) => {
          update("mediaServer", v as MediaServer);
        }}
        options={[
          { value: "none", label: "None (I'll add it later)" },
          { value: "plex", label: "Plex" },
          { value: "jellyfin", label: "Jellyfin" },
          { value: "emby", label: "Emby" },
        ]}
      />

      <div className="rounded-lg border border-fd-border bg-fd-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Secrets</label>
          <button
            onClick={() => {
              update("backendApiKey", generateSecret(32));
              update("authSecret", generateSecret(32, "base64"));
              update("dbPassword", generateSecret(24));
            }}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500"
          >
            Generate All
          </button>
        </div>
        <InputField
          label="Backend API Key"
          value={config.backendApiKey}
          onChange={(v) => {
            update("backendApiKey", v);
          }}
          placeholder="Click 'Generate All'"
          mono
        />
        <InputField
          label="Auth Secret"
          value={config.authSecret}
          onChange={(v) => {
            update("authSecret", v);
          }}
          placeholder="Click 'Generate All'"
          mono
        />
        <InputField
          label="Database Password"
          value={config.dbPassword}
          onChange={(v) => {
            update("dbPassword", v);
          }}
          placeholder="Click 'Generate All'"
          mono
        />
      </div>
    </div>
  );
}

function TSPreview({
  output,
}: {
  output: { compose: string; env: string; systemd: string };
}) {
  const [tab, setTab] = useState<"systemd" | "compose" | "env">("systemd");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-fd-border">
        {(
          [
            { id: "systemd", label: "1. riven-mount.service" },
            { id: "compose", label: "2. docker-compose.yml" },
            { id: "env", label: "3. .env" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-fd-muted-foreground hover:text-fd-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "systemd" && (
        <>
          <div className="rounded-lg border border-fd-border bg-fd-muted/30 p-4 text-sm space-y-2">
            <p className="font-medium">Installation:</p>
            <ol className="list-decimal list-inside space-y-1 text-fd-muted-foreground text-xs">
              <li>
                Create mount dir:{" "}
                <code className="rounded bg-fd-muted px-1.5 py-0.5">
                  sudo mkdir -p{" "}
                  {/--bind (\S+)/.exec(output.systemd)?.[1] ?? "/mnt/riven"}
                </code>
              </li>
              <li>
                Save to{" "}
                <code className="rounded bg-fd-muted px-1.5 py-0.5">
                  /etc/systemd/system/riven-mount.service
                </code>
              </li>
              <li>
                Run:{" "}
                <code className="rounded bg-fd-muted px-1.5 py-0.5">
                  sudo systemctl daemon-reload && sudo systemctl enable --now
                  riven-mount.service
                </code>
              </li>
            </ol>
          </div>
          <CodePreview
            code={output.systemd}
            language="ini"
            label="Systemd Service"
            filename="riven-mount.service"
          />
        </>
      )}
      {tab === "compose" && (
        <CodePreview
          code={output.compose}
          language="yaml"
          label="Docker Compose"
          filename="docker-compose.yml"
        />
      )}
      {tab === "env" && (
        <CodePreview
          code={output.env}
          language="bash"
          label="Environment File"
          filename=".env"
        />
      )}
    </div>
  );
}

function V1Preview({
  output,
}: {
  output: { compose: string; systemd: string };
}) {
  const [tab, setTab] = useState<"systemd" | "compose">("systemd");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-fd-border">
        <button
          onClick={() => {
            setTab("systemd");
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "systemd"
              ? "border-b-2 border-fd-primary text-fd-primary"
              : "text-fd-muted-foreground hover:text-fd-foreground"
          }`}
        >
          1. riven-mount.service
        </button>
        <button
          onClick={() => {
            setTab("compose");
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "compose"
              ? "border-b-2 border-fd-primary text-fd-primary"
              : "text-fd-muted-foreground hover:text-fd-foreground"
          }`}
        >
          2. docker-compose.yml
        </button>
      </div>

      {tab === "systemd" && (
        <CodePreview
          code={output.systemd}
          language="ini"
          label="Systemd Service"
          filename="riven-mount.service"
        />
      )}
      {tab === "compose" && (
        <CodePreview
          code={output.compose}
          language="yaml"
          label="Docker Compose"
          filename="docker-compose.yml"
        />
      )}
    </div>
  );
}
