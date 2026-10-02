import { createRemoteJWKSet, jwtVerify } from 'jose';

export type AccessEnvironment = {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
};

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function authenticateAccess(request: Request, env: AccessEnvironment): Promise<Request> {
  const domain = env.ACCESS_TEAM_DOMAIN;
  if (!domain || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) || !env.ACCESS_AUD) {
    throw new Error('Access is not configured.');
  }

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) throw new Error('Access sign-in required.');

  const issuer = `https://${domain}`;
  let keys = keySets.get(issuer);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    keySets.set(issuer, keys);
  }

  const { payload } = await jwtVerify(token, keys, {
    issuer,
    audience: env.ACCESS_AUD,
    algorithms: ['RS256'],
    requiredClaims: ['exp', 'sub', 'email'],
  });
  if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string' || !payload.email) {
    throw new Error('A signed-in user is required.');
  }

  // Only verified Access claims can become identity headers used by the app.
  const headers = new Headers(request.headers);
  for (const name of Array.from(headers.keys())) {
    if (name.startsWith('oai-authenticated-')) headers.delete(name);
  }
  headers.set('oai-authenticated-user-id', `cloudflare:${payload.sub}`);
  headers.set('oai-authenticated-user-email', payload.email);
  return new Request(request, { headers });
}
