import { ConfigReader } from '@backstage/config';
import type { Request } from 'express';
import * as jose from 'jose';
import { datumGatewayAuthenticator } from './authModuleDatumGatewayProvider';

jest.mock('jose', () => {
  const actual = jest.requireActual('jose');
  return { __esModule: true, ...actual, createRemoteJWKSet: jest.fn() };
});

const ISSUER = 'https://accounts.google.com';
const AUDIENCE = 'test-client-id.apps.googleusercontent.com';
const HEADER = 'x-auth-request-id-token';
const KID = 'test-key';

let privateKey: CryptoKey;

const reqWith = (token?: string): Request =>
  ({
    header: (name: string) =>
      name.toLowerCase() === HEADER ? token : undefined,
  } as unknown as Request);

const sign = (
  claims: jose.JWTPayload,
  opts: { issuer?: string; audience?: string; expSeconds?: number } = {},
) =>
  new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${opts.expSeconds ?? 3600}s`)
    .sign(privateKey);

const initialize = () =>
  datumGatewayAuthenticator.initialize({
    config: new ConfigReader({
      header: 'X-Auth-Request-Id-Token',
      issuer: ISSUER,
      audience: AUDIENCE,
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    }),
  });

beforeAll(async () => {
  const pair = await jose.generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const publicJwk = await jose.exportJWK(pair.publicKey);
  const localJwks = jest
    .requireActual('jose')
    .createLocalJWKSet({ keys: [{ ...publicJwk, kid: KID, alg: 'RS256' }] });
  (jose.createRemoteJWKSet as jest.Mock).mockReturnValue(localJwks);
});

describe('datumGatewayAuthenticator', () => {
  it('accepts a valid Google ID token and exposes its claims', async () => {
    const ctx = initialize();
    const token = await sign({ email: 'alice@datum.net', name: 'Alice' });

    const { result } = await datumGatewayAuthenticator.authenticate(
      { req: reqWith(token) },
      ctx,
    );

    expect(result.claims.email).toBe('alice@datum.net');
    expect(result.claims.aud).toBe(AUDIENCE);
  });

  it('maps claims to a profile with email and display name', async () => {
    const ctx = initialize();
    const token = await sign({ email: 'alice@datum.net', name: 'Alice' });
    const { result } = await datumGatewayAuthenticator.authenticate(
      { req: reqWith(token) },
      ctx,
    );

    const { profile } = await datumGatewayAuthenticator.defaultProfileTransform(
      result,
      {} as any,
    );

    expect(profile).toEqual({
      email: 'alice@datum.net',
      displayName: 'Alice',
      picture: undefined,
    });
  });

  it('rejects when the header is missing', async () => {
    const ctx = initialize();
    await expect(
      datumGatewayAuthenticator.authenticate({ req: reqWith() }, ctx),
    ).rejects.toThrow(/Missing/);
  });

  it('rejects a token with the wrong audience', async () => {
    const ctx = initialize();
    const token = await sign(
      { email: 'alice@datum.net' },
      { audience: 'someone-else' },
    );
    await expect(
      datumGatewayAuthenticator.authenticate({ req: reqWith(token) }, ctx),
    ).rejects.toThrow(/verification failed/);
  });

  it('rejects a token with the wrong issuer', async () => {
    const ctx = initialize();
    const token = await sign(
      { email: 'alice@datum.net' },
      { issuer: 'https://evil.example.com' },
    );
    await expect(
      datumGatewayAuthenticator.authenticate({ req: reqWith(token) }, ctx),
    ).rejects.toThrow(/verification failed/);
  });

  it('rejects an expired token', async () => {
    const ctx = initialize();
    const token = await sign({ email: 'alice@datum.net' }, { expSeconds: -60 });
    await expect(
      datumGatewayAuthenticator.authenticate({ req: reqWith(token) }, ctx),
    ).rejects.toThrow(/verification failed/);
  });
});
