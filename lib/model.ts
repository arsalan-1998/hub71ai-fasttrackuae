import { z } from 'zod';
import { profileFields } from './profile.ts';
import { financialSchema } from './analytics.ts';
export const inputSchema = z.object({
    ...profileFields,
    financial: financialSchema.optional(),
    financialRoute: z.enum(['processing','manufacturing']).optional(),
    company: z.string().trim().min(1).max(100), product: z.enum(['Telecom ducts', 'Irrigation pipes', 'Industrial packaging']), country: z.string().trim().min(2).max(80), material: z.enum(['UAE', 'Saudi Arabia', 'Kazakhstan']), volume: z.number().min(100).max(100000), gulfShare: z.number().min(0).max(100), freight: z.number().min(50).max(700), energy: z.number().min(50).max(200), incentive: z.boolean(), budget: z.number().min(0).max(100000000), resin: z.number().min(500).max(4000), utilization: z.number().min(20).max(100)
});
export type Inputs = z.infer<typeof inputSchema>;
export type ScenarioId = 'europe' | 'processing' | 'manufacturing';
export type Scenario = {
    id: ScenarioId;
    name: string;
    subtitle: string;
    costs: {
        name: string;
        value: number;
    }[];
    unitCost: number;
    annualCost: number;
    capex: number;
    savings: number;
    payback: number | null;
    breakEven: number | null;
    budgetFit: boolean;
};
export const DEMO: Inputs = { company: 'Nordline Polymers', product: 'Telecom ducts', country: 'Germany', material: 'UAE', volume: 6000, gulfShare: 80, freight: 240, energy: 100, incentive: true, budget: 4000000, resin: 1150, utilization: 80, industry: 'Polymers & plastics', audience: 'Industrial buyers', goal: 'Reach Gulf customers', origin: 'UAE', stage: 'Existing company', scale: 'medium', onboardingComplete: false };
const round = (n: number) => Math.round(n * 100) / 100;
export function calculate(input: Inputs): Scenario[] {
    const i = inputSchema.parse(input), gulf = i.gulfShare / 100;
    const wageFactor = ({ Germany: 1, Italy: .88, Poland: .68 } as Record<string, number>)[i.country] ?? 1;
    const productFactor = { 'Telecom ducts': 1, 'Irrigation pipes': .94, 'Industrial packaging': 1.08 }[i.product];
    const sourceExtra = { UAE: 0, 'Saudi Arabia': 45, Kazakhstan: 190 }[i.material];
    const designs = [
        { id: 'europe' as const, name: 'Keep European production', subtitle: 'Existing plant · regional exports', variable: 250 * wageFactor * productFactor, energy: 180, fixed: 540000, capex: 0, inbound: i.material === 'Kazakhstan' ? 160 : 120, outbound: gulf * i.freight + (1 - gulf) * 50 },
        { id: 'processing' as const, name: 'Abu Dhabi processing', subtitle: 'Local finishing · imported semi-finished goods', variable: 290 * productFactor, energy: 85, fixed: 470000, capex: 1600000, inbound: 160 + sourceExtra, outbound: gulf * 55 + (1 - gulf) * i.freight },
        { id: 'manufacturing' as const, name: 'Abu Dhabi manufacturing', subtitle: 'Regional inputs · full production', variable: 195 * productFactor, energy: 150, fixed: 630000, capex: 3600000, inbound: 35 + sourceExtra, outbound: gulf * 55 + (1 - gulf) * i.freight }
    ];
    const base = designs.map(d => {
        const costs = [{ name: 'Raw material', value: i.resin }, { name: 'Inbound freight', value: d.inbound }, { name: 'Conversion & labour', value: d.variable }, { name: 'Energy', value: d.energy * i.energy / 100 * (d.id !== 'europe' && i.incentive ? .7 : 1) }, { name: 'Fixed operations', value: d.fixed / (i.volume * i.utilization / 100) }, { name: 'Outbound freight', value: d.outbound }, { name: 'Inventory financing', value: d.id === 'europe' ? 45 : 55 }].map(c => ({ ...c, value: round(c.value) }));
        const unitCost = round(costs.reduce((s, c) => s + c.value, 0));
        return { ...d, costs, unitCost, annualCost: round(unitCost * i.volume * i.utilization / 100) };
    });
    return base.map(d => { const savings = round(base[0].annualCost - d.annualCost); const variableEurope = base[0].unitCost - base[0].costs[4].value; const variableHere = d.unitCost - d.costs[4].value; const margin = variableEurope - variableHere; return { id: d.id, name: d.name, subtitle: d.subtitle, costs: d.costs, unitCost: d.unitCost, annualCost: d.annualCost, capex: d.capex, savings, payback: d.capex && savings > 0 ? round(d.capex / savings) : null, breakEven: d.id !== 'europe' && margin > 0 ? Math.ceil((d.capex / 5 + Math.max(0, d.fixed - base[0].fixed)) / margin) : null, budgetFit: d.capex <= i.budget }; });
}
export function recommend(input: Inputs) { const list = calculate(input); const best = [...list].filter(s => s.budgetFit).sort((a, b) => a.unitCost - b.unitCost)[0] ?? list[0]; const without = calculate({ ...input, incentive: false }).find(s => s.id === best.id)!; return { best, without, depends: best.id !== 'europe' && best.savings > 0 && without.savings <= 0 }; }
