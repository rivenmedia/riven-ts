import { StarCounter } from "@/components/star-counter";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Cog,
  Download,
  GitBranch,
  type LucideIcon,
  Puzzle,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

import packageJson from "../../package.json" with { type: "json" };

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Shield,
    title: "Virtual File System",
    description:
      "FUSE-based VFS organizes your media into a clean file structure without symlinks or copies.",
  },
  {
    icon: Puzzle,
    title: "Plugin Architecture",
    description:
      "Modular plugin system with an SDK. Add integrations for content discovery, scraping, downloading, and more.",
  },
  {
    icon: Cog,
    title: "Full Automation",
    description:
      "Automated content discovery, scraping, downloading, and library updates with intelligent state machines.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Stay updated with Discord, webhook, and custom notification URLs for media events.",
  },
  {
    icon: BarChart3,
    title: "GraphQL API",
    description:
      "Powerful Apollo GraphQL API for querying and managing your media library programmatically.",
  },
  {
    icon: GitBranch,
    title: "Smart Scraping",
    description:
      "Multiple scraper support with configurable quality preferences and intelligent torrent ranking.",
  },
];

const integrations = [
  { name: "Plex", url: "https://plex.tv" },
  { name: "Jellyfin", url: "https://jellyfin.org" },
  { name: "Real-Debrid", url: "https://real-debrid.com" },
  {
    name: "Torbox",
    url: "https://torbox.app/subscription?referral=7db23db7-e438-49fd-8d6f-629642a23858",
  },
  { name: "All-Debrid", url: "https://alldebrid.com" },
  { name: "Torrentio", url: "https://torrentio.strem.fun" },
  { name: "Comet", url: "https://github.com/g0ldyy/comet" },
  { name: "StremThru", url: "https://github.com/MunifTanjim/stremthru" },
  { name: "Listrr", url: "https://listrr.pro" },
  { name: "MDBList", url: "https://mdblist.com" },
  { name: "Seerr", url: "https://github.com/seerr-team/seerr" },
  { name: "TMDB", url: "https://www.themoviedb.org" },
  { name: "TVDB", url: "https://thetvdb.com" },
  { name: "Subdl", url: "https://subdl.com" },
];

const statusIndicators = [
  { label: "Open Source", color: "bg-green-500" },
  { label: "Self-Hosted", color: "bg-blue-500" },
  { label: "Docker Ready", color: "bg-purple-500" },
];

const pluginCount = Object.keys(packageJson.devDependencies).filter((dep) =>
  dep.startsWith("@repo/plugin-"),
).length;

const stats = [
  { value: `${String(pluginCount)}+`, label: "Plugins" },
  { value: "100%", label: "Open Source" },
  { value: "24/7", label: "Automated" },
];

async function getGitHubStars() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/rivenmedia/riven-ts",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count: number };
    return data.stargazers_count;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const stars = await getGitHubStars();
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-fd-border px-4 py-20 md:py-32">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-fd-background via-fd-background to-fd-muted/30" />
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-purple-500/5 blur-3xl animate-glow-pulse" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-muted/50 px-4 py-2 text-sm animate-fade-in">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-fd-muted-foreground">
                TypeScript rewrite &mdash; plugin-powered media automation
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl animate-fade-in stagger-1">
              Automate Your
              <br />
              <span className="bg-linear-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Media Library
              </span>
            </h1>

            <p className="mb-8 max-w-2xl text-lg text-fd-muted-foreground md:text-xl animate-fade-in stagger-2">
              Riven is a self-hosted media automation system. It discovers
              content, finds streams via debrid services, and serves them
              through a virtual file system to your media server.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center animate-fade-in stagger-3">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/rivenmedia/riven-ts"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background px-6 py-3 font-semibold transition-colors hover:bg-fd-muted/50"
              >
                <Download className="h-4 w-4" />
                View on GitHub
              </Link>
              {stars && <StarCounter targetCount={stars} />}
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-fd-muted-foreground animate-fade-in stagger-4">
              {statusIndicators.map((status) => (
                <div key={status.label} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${status.color}`} />
                  <span>{status.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-fd-border px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Built for Power Users
            </h2>
            <p className="text-lg text-fd-muted-foreground">
              A modern architecture designed for reliability and extensibility
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group rounded-xl border border-fd-border bg-fd-card p-6 transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 animate-slide-up stagger-${String(i + 1)}`}
              >
                <div className="mb-4 inline-flex rounded-lg bg-purple-500/10 p-3 text-purple-400 transition-colors group-hover:bg-purple-500/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-fd-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-b border-fd-border px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Seamless Integrations
            </h2>
            <p className="text-lg text-fd-muted-foreground">
              Connect with your favorite services through plugins
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {integrations.map((integration) => (
              <a
                key={integration.name}
                href={integration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg border border-fd-border bg-fd-card px-4 py-3 text-sm font-medium transition-all hover:border-purple-500/30 hover:bg-fd-muted/50"
              >
                {integration.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-fd-border bg-linear-to-br from-purple-500/5 via-violet-500/5 to-indigo-500/5 p-6 md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="min-w-0">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  Ready to get started?
                </h2>
                <p className="mb-6 text-lg text-fd-muted-foreground">
                  Deploy Riven in minutes with Docker. Use our interactive
                  generator or follow the documentation.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/docs"
                    className="inline-flex w-full items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-500 sm:w-auto"
                  >
                    Read Documentation
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/generator"
                    className="inline-flex w-full items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-6 py-3 font-semibold transition-colors hover:bg-fd-muted/50 sm:w-auto"
                  >
                    <Settings className="h-4 w-4" />
                    Compose Generator
                  </Link>
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="rounded-lg border border-fd-border bg-fd-background/50 p-6">
                  <h3 className="mb-4 font-semibold">Quick Start</h3>
                  <pre className="max-w-full overflow-x-auto rounded-lg bg-fd-muted/50 p-4 text-sm">
                    <code className="text-fd-muted-foreground">
                      {`docker compose up -d`}
                    </code>
                  </pre>
                  <p className="mt-3 text-xs text-fd-muted-foreground">
                    Use the{" "}
                    <Link
                      href="/generator"
                      className="text-purple-400 underline underline-offset-2"
                    >
                      compose generator
                    </Link>{" "}
                    to create your docker-compose.yml
                  </p>
                </div>

                <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Puzzle className="h-5 w-5 text-purple-400" />
                    <h4 className="font-semibold text-purple-400">
                      Extensible by Design
                    </h4>
                  </div>
                  <p className="text-sm text-fd-muted-foreground">
                    Build your own plugins with the Plugin SDK. Add custom
                    content sources, scrapers, or integrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-fd-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 text-center md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="mb-2 text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-fd-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
