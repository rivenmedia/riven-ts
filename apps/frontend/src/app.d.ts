declare global {
  declare const __APP_VERSION__: string;

  type SessionValidationResult = NonNullable<
    Awaited<
      ReturnType<(typeof import("$lib/server/auth").auth)["api"]["getSession"]>
    >
  >;

  namespace App {
    interface Locals extends SessionValidationResult {
      backendUrl: string;
      apiKey: string;
      backendAuthSigningSecret: string;
    }
  }

  // Navigator User-Agent Client Hints API
  interface NavigatorUABrandVersion {
    readonly brand: string;
    readonly version: string;
  }

  interface NavigatorUAData {
    readonly platform: string;
    readonly mobile: boolean;
    readonly brands: readonly NavigatorUABrandVersion[];
  }

  interface Navigator {
    readonly userAgentData?: NavigatorUAData;
  }
}

export {};
