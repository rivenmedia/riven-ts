export default async (job) => {
  await job.log("Hello from the test worker!");

  return {
    success: true,
    scuba: "riven",
  };
};
