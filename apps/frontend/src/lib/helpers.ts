import * as dateUtils from "$lib/utils/date";

export function generateSecret(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getSeasonAndYear(dateString: string): string {
  return dateUtils.getSeasonAndYear(dateString);
}

export function calculateAge(
  birthday: string | null,
  deathday: string | null = null,
): number | null {
  return dateUtils.calculateAge(birthday, deathday);
}

export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined) return "N/A";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];

  if (!size) {
    return "";
  }

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toString() + " " + size
  );
};

export function formatDate(dateStr: string | null): string | null {
  return dateUtils.formatDate(dateStr);
}

export function isDayAndMonthToday(dateStr: string | null): boolean {
  return dateUtils.isDayAndMonthToday(dateStr);
}

export const getServiceDisplayName = (service: string): string => {
  switch (service.toLowerCase()) {
    case "realdebrid":
      return "Real-Debrid";
    case "torbox":
      return "TorBox";
    case "alldebrid":
      return "AllDebrid";
    default:
      return service;
  }
};

export const getColor = (colors: string[], max: number, value: number) => {
  if (!value) return colors[0];
  const p = (value / max) * (colors.length - 1);
  return colors[Math.ceil(p)];
};

export const getCalendar = (data: Record<string, number>, year: number) => {
  return dateUtils.getCalendar(data, year);
};
