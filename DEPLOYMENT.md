# Deploy MAD from GitHub

Target repository: https://github.com/arsalan-1998/hub71ai-fasttrackuae

`.github/workflows/deploy.yml` deploys this complete application to Cloudflare Workers whenever `main` or `master` changes. You can also run **Deploy MAD** from GitHub's Actions tab. The workflow installs the locked dependencies, builds the application, applies D1 migrations and deploys it. It intentionally has no tests, lint or type-check step.

The app has server routes, an OpenAI integration and a D1 database. GitHub Pages only hosts static files, so it cannot host these features. GitHub Actions manages the deployment; Cloudflare runs the application.

## One-time Cloudflare setup

1. Create a D1 database named `mad-assessments` in your Cloudflare account. Save its database ID.
2. Enable Cloudflare Zero Trust. Create an Access self-hosted application for your future Worker hostname, normally `mad-fasttrackuae.<your-workers-subdomain>.workers.dev`. Add an **Allow** policy for the people who should have access. Copy its **Application Audience (AUD) Tag** and your team hostname, such as `your-team.cloudflareaccess.com`.
3. Create an API token scoped to your account with **Workers Scripts: Edit** and **D1: Edit** permissions. It must also be able to read the account's Workers subdomain. Do not put the token in a source file.

The Worker verifies Access JWT signatures, issuer, audience and expiry before using their subject as the owner of saved assessments. It refuses application requests without valid Access identity, including direct requests that bypass the sign-in page. Generated configuration disables preview URLs. Protect the whole hostname, or enable the Worker's **Access → All traffic** protection for all its domains.

## GitHub repository settings

In **Settings → Secrets and variables → Actions**, add:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| Secret | `CLOUDFLARE_API_TOKEN` | Your scoped deployment token |
| Variable | `CLOUDFLARE_D1_DATABASE_ID` | ID of your new D1 database |
| Variable | `ACCESS_TEAM_DOMAIN` | `your-team.cloudflareaccess.com`, without `https://` |
| Variable | `ACCESS_AUD` | Your Access application's audience tag |
| Optional variable | `CLOUDFLARE_WORKER_NAME` | Defaults to `mad-fasttrackuae` |
| Optional variable | `CLOUDFLARE_D1_DATABASE_NAME` | Defaults to `mad-assessments` |
| Optional variable | `OPENAI_MODEL` | A Responses model available to your OpenAI project, with web search and structured outputs support |

Keep the Access application hostname in sync if you change the Worker name or add a custom domain. Account credentials are only supplied through GitHub secrets. Other settings generate an ignored `wrangler.cloudflare.json`; the Vite plugin generates the final deployment configuration in `dist/server/wrangler.json`.

## Enable the existing AI features

After the first deployment, add `OPENAI_API_KEY` as a **secret** in **Cloudflare → Workers & Pages → mad-fasttrackuae → Settings → Variables and Secrets**. Set `OPENAI_MODEL` in GitHub variables and redeploy. The key stays on the server; the app reports that AI is unavailable until both settings exist. Wrangler preserves existing runtime secrets on later deployments.

## Upload the source and deploy

Add this source at the repository root, including the `pnpm-lock.yaml`, `.github` directory and `drizzle` migrations. Preserve existing repository work when merging these files. Commit and push to the repository's `main` or `master` branch. The workflow only deploys from these branches in the named repository and serializes deployments so database migrations do not overlap.

Open the deployment URL printed by Wrangler in the Actions run. Cloudflare Access will ask allowed visitors to sign in. Authentication misconfiguration produces a 403 response until Access is set up correctly.

The new Cloudflare deployment uses its own database and Access user identities. It does not automatically transfer assessments from the existing private Site. Browser storage is also specific to the hostname; the current Site's local assessments stay there.

## Existing private Site

The existing `vite.config.ts`, `.openai/hosting.json` and `build/sites-worker.ts` still support the private Site deployment. The GitHub workflow uses the separate `vite.cloudflare.config.ts` and `build/cloudflare-worker.ts`. No deployment credentials are included in this repository.

Official references: [Workers with GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
