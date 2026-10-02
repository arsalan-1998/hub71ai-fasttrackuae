import { writeFileSync } from 'node:fs';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} in your GitHub repository settings.`);
  return value;
}

// Never write account credentials or API keys to the generated configuration.
required('CLOUDFLARE_API_TOKEN');
required('CLOUDFLARE_ACCOUNT_ID');
const databaseId = required('CLOUDFLARE_D1_DATABASE_ID');
if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(databaseId)
  || databaseId === '00000000-0000-4000-8000-000000000000') {
  throw new Error('CLOUDFLARE_D1_DATABASE_ID must identify a real D1 database.');
}

const teamDomain = required('ACCESS_TEAM_DOMAIN');
if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(teamDomain)) {
  throw new Error('ACCESS_TEAM_DOMAIN must be your-team.cloudflareaccess.com, without https:// or a path.');
}

const workerName = process.env.CLOUDFLARE_WORKER_NAME?.trim() || 'mad-fasttrackuae';
if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(workerName)) {
  throw new Error('CLOUDFLARE_WORKER_NAME must contain lowercase letters, numbers and hyphens.');
}

const config = {
  $schema: './node_modules/wrangler/config-schema.json',
  name: workerName,
  main: './build/cloudflare-worker.ts',
  compatibility_date: '2026-05-15',
  compatibility_flags: ['nodejs_compat'],
  workers_dev: true,
  preview_urls: false,
  d1_databases: [{
    binding: 'DB',
    database_name: process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim() || 'mad-assessments',
    database_id: databaseId,
    migrations_dir: 'drizzle',
  }],
  vars: {
    ACCESS_TEAM_DOMAIN: teamDomain,
    ACCESS_AUD: required('ACCESS_AUD'),
    OPENAI_MODEL: process.env.OPENAI_MODEL?.trim() || '',
  },
};

writeFileSync('wrangler.cloudflare.json', `${JSON.stringify(config, null, 2)}\n`);
console.log('Cloudflare configuration prepared.');
