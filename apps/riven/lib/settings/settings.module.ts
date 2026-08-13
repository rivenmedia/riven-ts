import { Global, Inject, Module } from "@nestjs/common";

import { settings } from "../utilities/settings.ts";

import type { RivenSettings } from "../riven-settings.schema.ts";
import type { ReadonlyDeep } from "type-fest";

/**
 * The parsed, frozen core configuration.
 */
export type RivenSettingsValues = ReadonlyDeep<RivenSettings>;

export const RIVEN_SETTINGS = Symbol("RIVEN_SETTINGS");

/**
 * Injects the parsed core configuration.
 *
 * @returns The parameter decorator
 */
export function InjectSettings() {
  return Inject(RIVEN_SETTINGS);
}

/**
 * Exposes the core configuration to the DI container.
 *
 * The settings are parsed once at import time and also propagated to worker
 * threads via `node:worker_threads` environment data, which the DI container
 * cannot reach. The existing singleton therefore remains the source of truth
 * and is surfaced here as a value provider rather than being reconstructed.
 */
@Global()
@Module({
  providers: [{ provide: RIVEN_SETTINGS, useValue: settings }],
  exports: [RIVEN_SETTINGS],
})
export class SettingsModule {}
