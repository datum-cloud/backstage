import type {
  DatabaseService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  createRetryingDatabaseService,
  DATABASE_STARTUP_TIMEOUT_MS,
} from './database';

const knexStub = { name: 'knex' } as unknown as Awaited<
  ReturnType<DatabaseService['getClient']>
>;

const createLogger = (): LoggerService => {
  const logger: LoggerService = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: () => logger,
  };
  return logger;
};

const createMemoizingDelegateFactory = (
  connect: () => Promise<Awaited<ReturnType<DatabaseService['getClient']>>>,
) => {
  const connects = jest.fn(connect);
  const createDelegate = jest.fn((): DatabaseService => {
    let cached: ReturnType<DatabaseService['getClient']> | undefined;
    return {
      getClient() {
        if (!cached) {
          cached = connects();
        }
        return cached;
      },
    };
  });
  return { createDelegate, connects };
};

describe('createRetryingDatabaseService', () => {
  it('returns the client without waiting when the database is reachable', async () => {
    const getClient = jest.fn().mockResolvedValue(knexStub);
    const sleep = jest.fn().mockResolvedValue(undefined);

    const service = createRetryingDatabaseService({
      createDelegate: () => ({ getClient }),
      logger: createLogger(),
      sleep,
    });

    await expect(service.getClient()).resolves.toBe(knexStub);
    expect(getClient).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('rides out a brief outage and then connects', async () => {
    let clock = 0;
    const connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND postgres'))
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND postgres'))
      .mockResolvedValue(knexStub);
    const sleep = jest.fn(async (ms: number) => {
      clock += ms;
    });

    const service = createRetryingDatabaseService({
      createDelegate: () => ({ getClient: connect }),
      logger: createLogger(),
      timeoutMs: 30_000,
      intervalMs: 1_000,
      now: () => clock,
      sleep,
    });

    await expect(service.getClient()).resolves.toBe(knexStub);
    expect(connect).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('retries against a delegate that caches its first failure', async () => {
    let clock = 0;
    const { createDelegate, connects } = createMemoizingDelegateFactory(
      jest
        .fn()
        .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND postgres'))
        .mockResolvedValue(knexStub),
    );
    const sleep = jest.fn(async (ms: number) => {
      clock += ms;
    });

    const service = createRetryingDatabaseService({
      createDelegate,
      logger: createLogger(),
      timeoutMs: 30_000,
      intervalMs: 1_000,
      now: () => clock,
      sleep,
    });

    await expect(service.getClient()).resolves.toBe(knexStub);
    expect(connects).toHaveBeenCalledTimes(2);
    expect(createDelegate).toHaveBeenCalledTimes(2);
  });

  it('gives up with the last error once the retry window closes', async () => {
    let clock = 0;
    const error = new Error('getaddrinfo ENOTFOUND postgres');
    const connect = jest.fn().mockRejectedValue(error);
    const sleep = jest.fn(async (ms: number) => {
      clock += ms;
    });

    const service = createRetryingDatabaseService({
      createDelegate: () => ({ getClient: connect }),
      logger: createLogger(),
      timeoutMs: 5_000,
      intervalMs: 1_000,
      now: () => clock,
      sleep,
    });

    await expect(service.getClient()).rejects.toThrow(error);
    expect(connect).toHaveBeenCalledTimes(6);
  });

  it('passes the migration settings of the wrapped service through', () => {
    const service = createRetryingDatabaseService({
      createDelegate: () => ({
        getClient: jest.fn().mockResolvedValue(knexStub),
        migrations: { skip: true },
      }),
      logger: createLogger(),
    });

    expect(service.migrations).toEqual({ skip: true });
    expect(DATABASE_STARTUP_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
