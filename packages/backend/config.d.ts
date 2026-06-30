export interface Config {
  auth?: {
    providers?: {
      /**
       * Trust the identity forwarded by the internal-auth gateway. The gateway
       * verifies the user interactively at the edge and forwards the raw OIDC
       * ID token JWT in a request header; this provider validates that token
       * (signature via the issuer JWKS, plus issuer/audience/expiry) and signs
       * the user in. There is no interactive flow in Backstage.
       */
      datumGateway?: {
        /**
         * Request header carrying the raw ID token JWT (no `Bearer` prefix).
         * Defaults to `X-Auth-Request-Id-Token`.
         */
        header?: string;
        /**
         * Expected `iss` claim, e.g. `https://accounts.google.com`.
         */
        issuer: string;
        /**
         * Expected `aud` claim — the gateway's OIDC client ID.
         */
        audience: string;
        /**
         * JWKS endpoint used to verify the token signature. Defaults to
         * Google's JWKS (`https://www.googleapis.com/oauth2/v3/certs`).
         */
        jwksUrl?: string;
      };
    };
  };
}
