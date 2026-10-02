import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

// Separate entrypoint keeps the existing private Site's deployment unchanged.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      configPath: './wrangler.cloudflare.json',
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      inspectorPort: false,
    }),
  ],
});
