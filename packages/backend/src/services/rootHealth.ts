import {
  coreServices,
  createServiceFactory,
  type RootHealthService,
  type RootLifecycleService,
} from '@backstage/backend-plugin-api';

export const STARTUP_LIVENESS_TIMEOUT_MS = 300_000;

type StartupState = 'init' | 'up' | 'down';

export class StartupDeadlineRootHealthService implements RootHealthService {
  #state: StartupState = 'init';
  readonly #startedAt: number;
  readonly #timeoutMs: number;
  readonly #now: () => number;

  constructor(options: {
    lifecycle: RootLifecycleService;
    timeoutMs?: number;
    now?: () => number;
  }) {
    this.#now = options.now ?? (() => Date.now());
    this.#timeoutMs = options.timeoutMs ?? STARTUP_LIVENESS_TIMEOUT_MS;
    this.#startedAt = this.#now();

    options.lifecycle.addStartupHook(() => {
      this.#state = 'up';
    });
    options.lifecycle.addBeforeShutdownHook(() => {
      this.#state = 'down';
    });
  }

  async getLiveness() {
    if (
      this.#state === 'init' &&
      this.#now() - this.#startedAt >= this.#timeoutMs
    ) {
      return {
        status: 500,
        payload: {
          status: 'error',
          message: 'Backend did not become ready within the startup deadline',
        },
      };
    }
    return { status: 200, payload: { status: 'ok' } };
  }

  async getReadiness() {
    if (this.#state === 'init') {
      return {
        status: 503,
        payload: { status: 'error', message: 'Backend has not started yet' },
      };
    }
    if (this.#state === 'down') {
      return {
        status: 503,
        payload: { status: 'error', message: 'Backend is shutting down' },
      };
    }
    return { status: 200, payload: { status: 'ok' } };
  }
}

export const startupDeadlineRootHealthServiceFactory = createServiceFactory({
  service: coreServices.rootHealth,
  deps: {
    lifecycle: coreServices.rootLifecycle,
  },
  async factory({ lifecycle }) {
    return new StartupDeadlineRootHealthService({ lifecycle });
  },
});
