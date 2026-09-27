import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

const typeStyles = {
  movie: {
    item: "border-orange-500/30 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30",
    icon: "text-orange-400",
    dot: "bg-orange-400",
  },
  episode: {
    item: "border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
    icon: "text-blue-400",
    dot: "bg-blue-400",
  },
  show: {
    item: "border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30",
    icon: "text-purple-400",
    dot: "bg-purple-400",
  },
  season: {
    item: "border-green-500/30 bg-green-500/20 text-green-300 hover:bg-green-500/30",
    icon: "text-green-400",
    dot: "bg-green-400",
  },
} satisfies Record<MediaItemType, { item: string; icon: string; dot: string }>;

export function getTypeStyle(type: MediaItemType) {
  return typeStyles[type];
}
