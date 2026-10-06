export function describeProvider(preposition: string, provider: string | null) {
  return provider ? ` ${preposition} ${provider}` : "";
}
