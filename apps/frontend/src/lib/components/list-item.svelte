<script lang="ts">
  import PortraitCard from "$lib/components/media/portrait-card.svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { cn } from "$lib/utils";
  import { resolve } from "$app/paths";
  import logger from "$lib/logger";

  const badgeVariantClasses: Record<string, string> = {
    success: "bg-green-600/90 text-white border-0",
    error: "bg-red-600/90 text-white border-0",
    default: "bg-yellow-600/90 text-white border-0",
  };

  interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
    indexer: string | undefined;
    type: string | undefined;
    isSelectable?: boolean;
    selectStore?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      has: (id: any) => boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toggle: (id: any) => void;
    };
    class?: string;
  }

  let {
    // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment
    data = $bindable(),
    indexer = $bindable<string | undefined>(),
    type = $bindable<string | undefined>(),
    isSelectable = false,
    selectStore,
    class: className = "",
  }: Props = $props();

  // Normalize type for different indexers
  let normalizedType = $derived.by(() => {
    let t = type;
    if (indexer === "anilist" && !t) t = data["media_type"];
    if ((indexer === "tvdb" || indexer === "tmdb") && t === "show") t = "tv";
    // Ensure type is set if only in data
    if (!t && data["media_type"]) t = data["media_type"];
    return t;
  });

  let mediaURL = $derived.by(() => {
    if (!data["id"]) return null;
    if (normalizedType === "person" || normalizedType === "company") {
      return `/details/entity/${data["id"]}/${normalizedType}`;
    }

    if (
      (indexer === "tmdb" || indexer === "tvdb" || indexer === undefined) &&
      (normalizedType === "movie" || normalizedType === "tv")
    ) {
      const params: string[] = [];
      if (indexer === "tvdb") params.push("indexer=tvdb");
      if (data["details_query"]) {
        for (const [key, value] of Object.entries(data["details_query"])) {
          params.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
          );
        }
      }
      const queryParam = params.length > 0 ? `?${params.join("&")}` : "";
      // If indexer is undefined, assume tmdb behavior for now as default
      return `/details/media/${data["id"]}/${normalizedType}${queryParam}`;
    }
    return `/details/${indexer}${normalizedType ? `/${normalizedType}` : ""}/${data["id"]}`;
  });

  let subtitle = $derived.by(() => {
    const parts = [];

    if (data["media_type"] === "tv" || normalizedType === "tv")
      parts.push("TV");
    else if (data["media_type"] === "movie" || normalizedType === "movie")
      parts.push("Movie");
    else if (data["media_type"] === "person" || normalizedType === "person")
      parts.push("Person");
    else if (data["media_type"] === "company" || normalizedType === "company")
      parts.push("Studio");

    if (data["year"] && data["year"] !== "N/A") parts.push(data["year"]);

    return parts.join(" • ") || null;
  });

  // Default container classes (w-full allows grid to control width)
  // Merged with passed className
  const containerClasses = $derived(
    cn(
      "group relative block w-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
      className,
    ),
  );

  function getMediaHref(mediaURL: string) {
    const [pathname, search = ""] = mediaURL.split("?");

    if (pathname?.startsWith("/details/media/")) {
      const [, , , id, mediaType] = pathname.split("/");

      if (!id || !mediaType) {
        logger.error("Invalid media URL:", mediaURL);

        return mediaURL;
      }

      const basePath = resolve("/(protected)/details/media/[id]/[mediaType]", {
        id,
        mediaType,
      });
      return search ? `${basePath}?${search}` : basePath;
    }

    if (pathname?.startsWith("/details/entity/")) {
      const [, , , id, type] = pathname.split("/");

      if (!id || !type) {
        logger.error("Invalid entity URL:", mediaURL);
        return mediaURL;
      }

      return resolve("/(protected)/details/entity/[id]/[type]", { id, type });
    }

    return mediaURL;
  }
</script>

{#snippet cardContent()}
  <PortraitCard
    title={data["title"] ?? ""}
    {subtitle}
    image={data["poster_path"]}
    {isSelectable}
    isSelected={Boolean(
      isSelectable && !!data["riven_id"] && selectStore?.has(data["riven_id"]),
    )}
    onSelectToggle={() => selectStore?.toggle(data["riven_id"])}
  >
    {#snippet topRight()}
      {#if data["badge"]}
        <Badge
          class={cn(
            "border-white/10 px-2 py-0.5 text-[10px] shadow-sm backdrop-blur-md",
            badgeVariantClasses[data["badge"].variant] ??
              badgeVariantClasses["default"],
          )}>{data["badge"].text}</Badge
        >
      {/if}
    {/snippet}
  </PortraitCard>
{/snippet}

{#if mediaURL}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
  <a href={getMediaHref(mediaURL)} class={containerClasses}>
    {@render cardContent()}
  </a>
{:else}
  <div
    role="button"
    aria-disabled="true"
    tabindex="-1"
    class={containerClasses}
  >
    {@render cardContent()}
  </div>
{/if}
