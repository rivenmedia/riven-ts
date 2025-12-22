import { createParameterDecorator } from "type-graphql";

export function PluginContext(pluginSymbol: symbol) {
  return createParameterDecorator<Record<symbol, unknown>>(
    ({ context }) => context[pluginSymbol],
  );
}
