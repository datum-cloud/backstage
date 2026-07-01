import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  commonSignInResolvers,
  createProxyAuthenticator,
  createProxyAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { AuthenticationError } from '@backstage/errors';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';

const DEFAULT_HEADER = 'x-auth-request-id-token';
const DEFAULT_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

type DatumGatewayResult = { claims: JWTPayload };

type DatumGatewayContext = {
  header: string;
  jwks: JWTVerifyGetKey;
  issuer: string[];
  audience: string;
};

const bearer = /^Bearer[ ]+(\S+)$/i;

export const datumGatewayAuthenticator = createProxyAuthenticator({
  defaultProfileTransform: async (result: DatumGatewayResult) => ({
    profile: {
      email:
        typeof result.claims.email === 'string'
          ? result.claims.email
          : undefined,
      displayName:
        typeof result.claims.name === 'string' ? result.claims.name : undefined,
      picture:
        typeof result.claims.picture === 'string'
          ? result.claims.picture
          : undefined,
    },
  }),
  initialize({ config }): DatumGatewayContext {
    const header = (
      config.getOptionalString('header') ?? DEFAULT_HEADER
    ).toLowerCase();
    const issuer = config.getString('issuer');
    const audience = config.getString('audience');
    const jwksUrl = config.getOptionalString('jwksUrl') ?? DEFAULT_JWKS_URL;

    return {
      header,
      audience,
      jwks: createRemoteJWKSet(new URL(jwksUrl)),
      issuer: issuer.startsWith('https://accounts.google.com')
        ? [issuer, 'accounts.google.com']
        : [issuer],
    };
  },
  async authenticate({ req }, ctx) {
    const raw = req.header(ctx.header);
    if (!raw) {
      throw new AuthenticationError(`Missing ${ctx.header} header`);
    }
    const token = bearer.exec(raw)?.[1] ?? raw.trim();

    try {
      const { payload } = await jwtVerify(token, ctx.jwks, {
        issuer: ctx.issuer,
        audience: ctx.audience,
      });
      return { result: { claims: payload } };
    } catch (error) {
      throw new AuthenticationError(
        'Gateway ID token verification failed',
        error,
      );
    }
  },
});

export const authModuleDatumGatewayProvider = createBackendModule({
  pluginId: 'auth',
  moduleId: 'datum-gateway-provider',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'datumGateway',
          factory: createProxyAuthProviderFactory({
            authenticator: datumGatewayAuthenticator,
            signInResolverFactories: {
              ...commonSignInResolvers,
            },
          }),
        });
      },
    });
  },
});

export default authModuleDatumGatewayProvider;
