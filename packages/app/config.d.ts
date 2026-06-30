export interface Config {
  app?: {
    signInPage?: {
      /**
       * Auth provider id the sign-in page proxies to (e.g. `datumGateway`).
       * When set, the app renders a transparent `ProxiedSignInPage` and trusts
       * the gateway-established session. When unset, the app falls back to the
       * guest sign-in page (local dev / e2e).
       *
       * @visibility frontend
       */
      provider?: string;
    };
  };
}
