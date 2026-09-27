export function getAlignmentClasses(
  align: "left" | "center" | "right",
  type: "container" | "flex",
): string {
  if (type === "container") {
    switch (align) {
      case "right": {
        return "items-end text-right";
      }
      case "center": {
        return "items-center text-center";
      }
      case "left": {
        return "items-start text-left";
      }
    }
  } else {
    switch (align) {
      case "right": {
        return "justify-end";
      }
      case "center": {
        return "justify-center";
      }
      case "left": {
        return "justify-start";
      }
    }
  }
}
