export const extractPluginNameFromJobId = (jobId: string): string => {
  const match = new RegExp(/plugin\[(.*)\]/i).exec(jobId);

  if (!match?.[1]) {
    throw new Error(`Could not extract plugin name from job ID: ${jobId}`);
  }

  return match[1];
};
