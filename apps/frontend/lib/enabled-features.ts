const enabledFeatures = {
  calendarPage: false,
  dashboardPage: false,
  settingsPage: false,
  logsPage: false,
  notificationCentre: false,
  selectableLibraryItems: false,
} as const satisfies Record<string, boolean>;

export function isFeatureEnabled(
  feature: keyof typeof enabledFeatures,
): boolean {
  return enabledFeatures[feature];
}
