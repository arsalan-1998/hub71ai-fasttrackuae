import handler from 'vinext/server/fetch-handler';
import { authenticateAccess, type AccessEnvironment } from '../lib/cloudflare-access';

export default {
  async fetch(request: Request, env: Cloudflare.Env & AccessEnvironment, ctx: ExecutionContext) {
    let authenticated: Request;
    try {
      authenticated = await authenticateAccess(request, env);
    } catch {
      return new Response('Sign in through Cloudflare Access to open MAD. If sign-in is unavailable, enable Access for this Worker.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    const origin = request.headers.get('origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin && origin !== new URL(request.url).origin) {
      return Response.json({ error: 'Use MAD on its own website to submit changes.' }, { status: 403 });
    }
    return handler.fetch(authenticated, env, ctx);
  },
};
