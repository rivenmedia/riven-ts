export function browserSupportsPasskeys(
  window: typeof globalThis.window,
): window is typeof globalThis.window & {
  PublicKeyCredential: typeof globalThis.PublicKeyCredential;
} {
  return (
    Boolean(window.PublicKeyCredential) &&
    typeof window.PublicKeyCredential.isConditionalMediationAvailable ===
      "function"
  );
}
