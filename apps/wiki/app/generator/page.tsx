import DockerComposeGenerator from "@/components/docker-compose-generator";
import { HomeLayout } from "fumadocs-ui/layouts/home";

export const metadata = {
  title: "Docker Compose Generator",
  description: "Generate a Docker Compose configuration for Riven.",
};

export default function GeneratorPage() {
  return (
    <HomeLayout
      nav={{
        title: <span className="font-bold tracking-tight">Riven</span>,
      }}
      links={[
        { text: "Docs", url: "/docs" },
        { text: "Generator", url: "/generator" },
        {
          text: "GitHub",
          url: "https://github.com/rivenmedia/riven-ts",
          external: true,
        },
      ]}
    >
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">
            Docker Compose Generator
          </h1>
          <p className="mt-2 text-fd-muted-foreground">
            Generate a complete Docker Compose configuration for your Riven
            setup.
          </p>
        </div>
        <DockerComposeGenerator />
      </div>
    </HomeLayout>
  );
}
