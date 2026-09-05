export function getTypeColor(type: string): string {
  switch (type) {
    case "movie": {
      return "bg-blue-500/10 text-blue-500";
    }

    case "show": {
      return "bg-purple-500/10 text-purple-500";
    }

    case "season": {
      return "bg-green-500/10 text-green-500";
    }

    case "episode": {
      return "bg-orange-500/10 text-orange-500";
    }

    default: {
      return "bg-gray-500/10 text-gray-500";
    }
  }
}
