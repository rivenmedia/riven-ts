import type { INestApplicationContext } from "@nestjs/common";
import type { ContainerType } from "type-graphql";

type ResolverClass = new (...args: never[]) => unknown;

function resolve(
  applicationContext: INestApplicationContext,
  someClass: ResolverClass,
): unknown {
  try {
    return applicationContext.get(someClass, { strict: false });
  } catch {
    // Not a registered provider: a plugin resolver, which takes no
    // dependencies and is constructed exactly as type-graphql would.
    return new someClass();
  }
}

/**
 * Builds a type-graphql container backed by the Nest DI container.
 *
 * Core resolvers are registered as providers and resolved through Nest, while
 * plugin resolvers live in separate packages and are unknown to it. Supplying
 * a container disables type-graphql's own fallback entirely, so the fallback
 * to plain construction is reimplemented here.
 *
 * Instances are cached so that the resolution attempt happens once per class
 * rather than on every field resolution. This matches type-graphql's default
 * behaviour of treating resolvers as singletons, and means request-scoped
 * providers are not supported.
 *
 * @param applicationContext The Nest application context
 * @returns The container
 */
export function createNestContainer(
  applicationContext: INestApplicationContext,
): ContainerType {
  const instances = new Map<ResolverClass, unknown>();

  return {
    get(someClass: ResolverClass) {
      if (instances.has(someClass)) {
        return instances.get(someClass);
      }

      const instance = resolve(applicationContext, someClass);

      instances.set(someClass, instance);

      return instance;
    },
  };
}
