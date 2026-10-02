# MAD — Manufacturing in Abu Dhabi

GitHub deployment: see [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub Actions workflow, Cloudflare setup and repository settings. The branding reuses the supplied logo's blue symbol with the MAD name.

A private manufacturing expansion product with a sourced landing page, a four-step company questionnaire and a personalized dashboard.

The landing page is `/`, the questionnaire is `/get-started`, and the dashboard is `/dashboard`. Completed questionnaires are stored as identity-scoped scenarios; the dashboard loads the saved scenario ID through a server-side owner check.

A manufacturing expansion workspace built with React, TypeScript and a Next.js-compatible Vinext runtime. Cloudflare D1 stores user-owned scenarios; server routes provide persistence and an optional OpenAI Responses integration.

## Structure

- `components/factory`: product UI and reusable presentation primitives.
- `components/ui`: shared interface components.
- `lib/model.ts`: validated inputs and illustrative comparative starting costs.
- `lib/analytics.ts`: validated financial assumptions and deterministic investment calculations.
- `components/factory/analytics-dashboard.tsx`: seven KPIs, five Recharts graphs, cost inputs, source case and audit table.
- `components/factory/setup-roadmap.tsx`: reusable estimated phase windows, dependencies, owners and evidence gates.
- `lib/profile.ts`, `lib/personalization.ts`: questionnaire validation, compatibility with existing scenarios, and transparent sector/customer rules.
- `lib/evidence.ts`: curated public evidence with source URLs, dates and conditions.
- `db/schema.ts`, `db/store.ts`, `drizzle`: schema, prepared-query access and migrations.
- `app/api/scenarios`: identity-scoped persistence.
- `app/api/analysis`: optional structured AI analysis, with source IDs.

## Financial model

All costs are illustrative assumptions, not supplier quotations. Annual production capacity multiplied by utilisation gives output tonnes. Fixed annual operations are allocated over output; customer mix weights outbound freight. Annual operating savings compare total pre-tax cost. The analytical dashboard adds setup contingency and working capital, a five-year incremental cash-flow model, two-year ramp-up, ROI, discounted NPV, interpolated payback, operating break-even and funding gap. Optional working-capital recovery is explicit. Financial inputs are validated and saved in scenario JSON; legacy scenarios remain compatible.

The base scenario assumes an existing European facility, with no new capital. All scenarios use the same resin price. Product/country conversion multipliers, fixed costs, freight and setup costs are illustrative. Tax, duties, VAT, financing of capital investment, dual-running/shutdown costs, maintenance capital expenditure and asset resale are excluded. Ramp-up is modelled at equal output for both facilities, with fixed costs held constant.

## OpenAI connection

The integration requires server-only `OPENAI_API_KEY` and `OPENAI_MODEL` runtime values. No credentials are included. Without them, the endpoint returns an explicit unavailable response. AI generates explanations from curated evidence; it does not calculate financial results. The `/api/case-study` endpoint uses Responses web search to find a matching company and returns cited source links. It rejects results without URL citations. Live AI has not been tested because the required workspace plugin is disabled. The reviewed Emtelle reference is a factual fallback, not AI-generated; no undisclosed returns are inferred.

## Development

Use the existing pnpm lockfile. `pnpm dev` serves the application, `pnpm build` creates Worker-compatible output, and `pnpm db:generate` generates migrations after schema changes. Deployment applies schema-only migrations. Server endpoints require the platform-authenticated user identity.

## Verification

TypeScript checking, financial model checks, and production build. Financial checks cover cost totals, customer-mix reversals, budget constraints, incentive effects and invalid inputs. Source records were researched on 2 October 2026 and are not automatically refreshed.

## Assessment scope

The qualitative assessment covers seven industry categories, existing businesses and new ventures. Quantitative estimates are available only for existing plastics manufacturers in Germany, Italy or Poland using supported regional origin assumptions. Every profile opens the analytical workspace. Profiles without a supported cost benchmark see explicit missing-data KPI and chart states, a separate fictional example, and a financial-input form. Entered comparable costs enable calculations for any country or sector, including France and new ventures, without inheriting plastics cost constants. Budget and scale bands map to disclosed illustrative values. Incentives are disabled by default for completed questionnaires.

## Hero asset and section navigation

The landing-page hero uses the bundled `public/images/manufacturing-logistics-hero.png` generated with the built-in image tool. Prompt: a photorealistic conceptual Gulf coastal manufacturing and logistics hub, with factories, container cranes, turquoise water and an Abu Dhabi-inspired skyline in a light blue/teal palette; no text or logos. It is labelled conceptual, rather than a photograph of a named port. Native section links use CSS smooth scrolling and respect reduced-motion preferences.

Analytical tests independently reconcile funding, ramp cash flows, NPV, ROI and payback; check missing selling price, explicit liquidity recovery, loss-making projects, zero investment, invalid inputs and saved finance round-trips. Qualitative company assessments are available in an expandable section below analytics. Financial results appear for supported illustrative benchmarks or explicitly entered comparable sector costs.

The visibility regression is covered by France, unbenchmarked-country, sector and new-venture financial tests. `lib/investment.ts` resolves the model or returns missing data; `financial-workspace.tsx` renders the universal entry state and keeps example-company inputs separate from saved user inputs.

## Minimal investment assessment

The final assessment step collects three optional financial estimates: all-inclusive funding required, annual home-country operating cost, and expected annual Abu Dhabi operating cost. All three must be completed together. Ramp-up and discount rate are optional advanced settings with disclosed defaults. `quickFinancial` stores an `annual-totals` mode; it does not infer cost categories or operating break-even. This mode shows an operating-cost reduction KPI. Existing detailed scenarios remain valid.

Dashboard edit actions reuse the current owner-checked scenario ID, retaining company answers, financial estimates and in-progress browser drafts. Submitting creates a revised scenario and redirects to its results. Dashboard financial forms have been removed; results use balanced KPI rows and aligned chart panels with consistent padding.

## Browser persistence

Versioned, validated localStorage records are scoped to the authenticated account. The assessment remembers incomplete company answers, financial strings, base financial inputs and the current step. Dashboard reloads restore the last completed inputs and regenerate results; an explicit scenario URL takes precedence unless the local record matches that same ID. Client hydration finishes before any automatic write. Corrupt or unavailable browser storage fails safely.

Completed submissions clear the draft, while example views never replace the actual company snapshot. Delete & start new removes only this account’s browser records after an accessible confirmation; account-saved scenarios remain available. The fresh-start URL is consumed once so refresh preserves the new draft. Data is retained on the same browser/device until cleared.
