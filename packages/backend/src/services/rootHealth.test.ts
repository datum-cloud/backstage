import type {
  LifecycleServiceStartupHook,
  RootLifecycleService,
} from '@backstage/backend-plugin-api';
import {
  StartupDeadlineRootHealthService,
  STARTUP_LIVENESS_TIMEOUT_MS,
} from './rootHealth';

const createLifecycle = () => {
  const startupHooks: LifecycleServiceStartupHook[] = [];
  const beforeShutdownHooks: Array<() => void | Promise<void>> = [];
  const lifecycle: RootLifecycleService = {
    addStartupHook: hook => {
      startupHooks.push(hook);
    },
    addShutdownHook: () => {},
    addBeforeShutdownHook: hook => {
      beforeShutdownHooks.push(hook);
    },
  };
  return {
    lifecycle,
    startup: async () => {
      for (const hook of startupHooks) {
        await hook();
      }
    },
    beforeShutdown: async () => {
      for (const hook of beforeShutdownHooks) {
        await hook();
      }
    },
  };
};

describe('StartupDeadlineRootHealthService', () => {
  it('serves liveness while the backend is still within its startup deadline', async () => {
    let clock = 1000;
    const { lifecycle } = createLifecycle();
    const health = new StartupDeadlineRootHealthService({
      lifecycle,
      timeoutMs: 60_000,
      now: () => clock,
    });

    clock += 59_999;

    await expect(health.getLiveness()).resolves.toEqual({
      status: 200,
      payload: { status: 'ok' },
    });
    await expect(health.getReadiness()).resolves.toMatchObject({ status: 503 });
  });

  it('fails liveness once the backend has never become ready in time', async () => {
    let clock = 1000;
    const { lifecycle } = createLifecycle();
    const health = new StartupDeadlineRootHealthService({
      lifecycle,
      timeoutMs: 60_000,
      now: () => clock,
    });

    clock += 60_000;

    await expect(health.getLiveness()).resolves.toMatchObject({ status: 500 });
  });

  it('keeps liveness passing indefinitely once the backend has started', async () => {
    let clock = 1000;
    const { lifecycle, startup } = createLifecycle();
    const health = new StartupDeadlineRootHealthService({
      lifecycle,
      timeoutMs: 60_000,
      now: () => clock,
    });

    await startup();
    clock += 10 * 60_000;

    await expect(health.getLiveness()).resolves.toMatchObject({ status: 200 });
    await expect(health.getReadiness()).resolves.toEqual({
      status: 200,
      payload: { status: 'ok' },
    });
  });

  it('reports not ready while shutting down but stays live', async () => {
    const { lifecycle, startup, beforeShutdown } = createLifecycle();
    const health = new StartupDeadlineRootHealthService({ lifecycle });

    await startup();
    await beforeShutdown();

    await expect(health.getReadiness()).resolves.toMatchObject({ status: 503 });
    await expect(health.getLiveness()).resolves.toMatchObject({ status: 200 });
  });

  it('defaults to a bounded startup deadline', () => {
    expect(STARTUP_LIVENESS_TIMEOUT_MS).toBeGreaterThan(0);
    expect(STARTUP_LIVENESS_TIMEOUT_MS).toBeLessThanOrEqual(600_000);
  });
});
