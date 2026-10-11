import { developmentEnvironment } from "#environment/development-environment.schema.ts";

export async function register() {
  if (
    process.env["NEXT_RUNTIME"] === "nodejs" &&
    developmentEnvironment.ENABLE_MOCKS
  ) {
    const { server } = await import("#mocks/node.ts");

    server.listen({ onUnhandledRequest: "bypass" });
  }
}
