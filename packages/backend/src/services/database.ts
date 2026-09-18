import { DatabaseManager } from '@backstage/backend-defaults/database';
import {
  coreServices,
  createServiceFactory,
  type DatabaseService,
  type LoggerService,
  type RootConfigService,
  type RootLifecycleService,
} from '@backstage/backend-plugin-api';
import { ConfigReader } from '@backstage/config';

export const DATABASE_STARTUP_TIMEOUT_MS = 30_000;
export const DATABASE_RETRY_INTERVAL_MS = 1_000;

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export function createRetryingDatabaseService(options: {
  createDelegate: () => DatabaseService;
  logger: LoggerService;
  timeoutMs?: number;
  intervalMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}): DatabaseService {
  const { createDelegate, logger } = options;
  const timeoutMs = options.timeoutMs ?? DATABASE_STARTUP_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DATABASE_RETRY_INTERVAL_MS;
  const now = options.now ?? (() => Date.now());
  const sleep = options.sleep ?? wait;

  const first = createDelegate();

  return {
    get migrations() {
      return first.migrations;
    },
    async getClient() {
      const deadline = now() + timeoutMs;
      let delegate = first;
      for (let attempt = 1; ; attempt++) {
        try {
          return await delegate.getClient();
        } catch (error) {
          if (now() >= deadline) {
            throw error;
          }
          logger.warn(
            `Database is not reachable, retrying in ${intervalMs}ms (attempt ${attempt})`,
            error as Error,
          );
          await sleep(intervalMs);
          delegate = createDelegate();
        }
      }
    },
  };
}

export function createDatabaseManager(
  config: RootConfigService,
  deps: {
    rootLifecycle: RootLifecycleService;
    rootLogger: LoggerService;
  },
): DatabaseManager {
  const resolved = config.getOptional('backend.database')
    ? config
    : new ConfigReader({
        backend: {
          database: { client: 'better-sqlite3', connection: ':memory:' },
        },
      });
  return DatabaseManager.fromConfig(resolved, deps);
}

export const retryingDatabaseServiceFactory = createServiceFactory({
  service: coreServices.database,
  deps: {
    config: coreServices.rootConfig,
    lifecycle: coreServices.lifecycle,
    logger: coreServices.logger,
    pluginMetadata: coreServices.pluginMetadata,
    rootLifecycle: coreServices.rootLifecycle,
    rootLogger: coreServices.rootLogger,
  },
  async factory({
    config,
    lifecycle,
    logger,
    pluginMetadata,
    rootLifecycle,
    rootLogger,
  }) {
    const pluginId = pluginMetadata.getId();
    const createDelegate = () =>
      createDatabaseManager(config, { rootLifecycle, rootLogger }).forPlugin(
        pluginId,
        { lifecycle, logger },
      );
    return createRetryingDatabaseService({ createDelegate, logger });
  },
});
