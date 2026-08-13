#!/usr/bin/env node

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.ts";

/**
 * The Nest entry point for Riven.
 *
 * Riven is an orchestrator rather than a request/response service, so the
 * container is created without an HTTP listener. The GraphQL server is mounted
 * onto Nest's Express adapter later in the migration, once bootstrap ordering
 * (database, plugins, VFS) is owned by the engine module.
 */
export async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);

  application.enableShutdownHooks();

  return application;
}
