export const extractPluginNameFromJobId = (jobId: string): string => {
  const match = /plugin\[(?<pluginName>.*)\]/iu.exec(jobId);

  if (!match?.groups?.["pluginName"]) {
    throw new Error(`Could not extract plugin name from job ID: ${jobId}`);
  }

  return match.groups["pluginName"];
};
