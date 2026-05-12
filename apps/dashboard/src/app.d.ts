// SvelteKit conventions: these interfaces are empty by design so user code
// can augment them via declaration merging. The empty-interface ESLint rule
// flags them but the SvelteKit-recommended shape is exactly this.
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    interface Locals {}
    interface PageData {}
    interface PageState {}
    interface Platform {}
  }
}

export {};
