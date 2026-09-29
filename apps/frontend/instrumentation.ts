import { developmentEnvironment } from "./environment/development-environment.schema";

export async function register() {
  if (
    process.env["NEXT_RUNTIME"] === "nodejs" &&
    developmentEnvironment.ENABLE_MOCKS
  ) {
    const { server } = await import("./mocks/node");

    server.listen({ onUnhandledRequest: "bypass" });
  }
}
