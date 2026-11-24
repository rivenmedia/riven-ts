export const isMockTestMode = () =>
  process.env["NODE_ENV"] === "test" && Boolean(process.env["MOCK_SCENARIO"]);
