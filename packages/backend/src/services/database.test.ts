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

describe('createRetryingDatabaseService', () => {
  it('returns the client without waiting when the database is reachable', async () => {
    const getClient = jest.fn().mockResolvedValue(knexStub);
    const sleep = jest.fn().mockResolvedValue(undefined);

    const service = createRetryingDatabaseService({
      delegate: { getClient },
      logger: createLogger(),
      sleep,
    });

    await expect(service.getClient()).resolves.toBe(knexStub);
    expect(getClient).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('rides out a brief outage and then connects', async () => {
    let clock = 0;
    const getClient = jest
      .fn()
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND postgres'))
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND postgres'))
      .mockResolvedValue(knexStub);
    const sleep = jest.fn(async (ms: number) => {
      clock += ms;
    });

    const service = createRetryingDatabaseService({
      delegate: { getClient },
      logger: createLogger(),
      timeoutMs: 30_000,
      intervalMs: 1_000,
      now: () => clock,
      sleep,
    });

    await expect(service.getClient()).resolves.toBe(knexStub);
    expect(getClient).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('gives up with the last error once the retry window closes', async () => {
    let clock = 0;
    const error = new Error('getaddrinfo ENOTFOUND postgres');
    const getClient = jest.fn().mockRejectedValue(error);
    const sleep = jest.fn(async (ms: number) => {
      clock += ms;
    });

    const service = createRetryingDatabaseService({
      delegate: { getClient },
      logger: createLogger(),
      timeoutMs: 5_000,
      intervalMs: 1_000,
      now: () => clock,
      sleep,
    });

    await expect(service.getClient()).rejects.toThrow(error);
    expect(getClient).toHaveBeenCalledTimes(6);
  });

  it('passes the migration settings of the wrapped service through', () => {
    const service = createRetryingDatabaseService({
      delegate: {
        getClient: jest.fn().mockResolvedValue(knexStub),
        migrations: { skip: true },
      },
      logger: createLogger(),
    });

    expect(service.migrations).toEqual({ skip: true });
    expect(DATABASE_STARTUP_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
