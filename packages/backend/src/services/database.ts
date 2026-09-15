import { DatabaseManager } from '@backstage/backend-defaults/database';
import {
  coreServices,
  createServiceFactory,
  type DatabaseService,
  type LoggerService,
} from '@backstage/backend-plugin-api';
import { ConfigReader } from '@backstage/config';

export const DATABASE_STARTUP_TIMEOUT_MS = 30_000;
export const DATABASE_RETRY_INTERVAL_MS = 1_000;

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export function createRetryingDatabaseService(options: {
  delegate: DatabaseService;
  logger: LoggerService;
  timeoutMs?: number;
  intervalMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}): DatabaseService {
  const { delegate, logger } = options;
  const timeoutMs = options.timeoutMs ?? DATABASE_STARTUP_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DATABASE_RETRY_INTERVAL_MS;
  const now = options.now ?? (() => Date.now());
  const sleep = options.sleep ?? wait;

  return {
    get migrations() {
      return delegate.migrations;
    },
    async getClient() {
      const deadline = now() + timeoutMs;
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
        }
      }
    },
  };
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
  async createRootContext({ config, rootLifecycle, rootLogger }) {
    return config.getOptional('backend.database')
      ? DatabaseManager.fromConfig(config, { rootLifecycle, rootLogger })
      : DatabaseManager.fromConfig(
          new ConfigReader({
            backend: {
              database: { client: 'better-sqlite3', connection: ':memory:' },
            },
          }),
          { rootLifecycle, rootLogger },
        );
  },
  async factory({ pluginMetadata, lifecycle, logger }, databaseManager) {
    return createRetryingDatabaseService({
      delegate: databaseManager.forPlugin(pluginMetadata.getId(), {
        lifecycle,
        logger,
      }),
      logger,
    });
  },
});
