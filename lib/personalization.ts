import type { Inputs } from './model.ts';
import { DEMO, inputSchema } from './model.ts';
import { questionnaireSchema, scales, type Questionnaire } from './profile.ts';
export function fromQuestionnaire(raw: Questionnaire): Inputs {
    const q = questionnaireSchema.parse(raw);
    return inputSchema.parse({ ...DEMO, ...q, volume: scales.find(s => s.id === q.scale)!.volume, material: q.origin === 'Saudi Arabia' ? 'Saudi Arabia' : q.origin === 'Central Asia' ? 'Kazakhstan' : 'UAE', incentive: false, onboardingComplete: true });
}
export function hasCostModel(i: Inputs) { return i.industry === 'Polymers & plastics' && ['Germany', 'Italy', 'Poland'].includes(i.country) && i.stage === 'Existing company' && ['UAE', 'Saudi Arabia', 'Central Asia'].includes(i.origin); }
const sectorNotes: Record<Inputs['industry'], {
    opportunity: string;
    benefit: string;
    risk: string;
    evidence: string[];
}> = {
    'Polymers & plastics': { opportunity: 'Regional polymer conversion', benefit: 'Explore pipes, ducts or packaging production near Gulf buyers and regional resin suppliers.', risk: 'Obtain resin grade, price and freight quotations; volume and customer mix determine the advantage.', evidence: ['polymers', 'energy', 'emtelle'] },
    'Food & ingredients': { opportunity: 'Processing and regional packing', benefit: 'Evaluate ingredient cleaning, blending, processing and packing close to regional distributors.', risk: 'Verify food approvals, shelf life, storage conditions and the actual inbound transport route.', evidence: ['grain', 'production', 'customs'] },
    'Metals & components': { opportunity: 'Downstream component production', benefit: 'Compare local machining, fabrication or finishing with shipping finished components from your base.', risk: 'Verify feedstock continuity, customer qualification, and carbon requirements for covered European imports.', evidence: ['production', 'customs', 'cbam'] },
    'Industrial equipment': { opportunity: 'Assembly, service and spare parts', benefit: 'Consider a regional assembly and service hub that can shorten customer response times.', risk: 'Obtain buyer qualification requirements and confirm demand before adding full manufacturing capacity.', evidence: ['production', 'customs', 'energy'] },
    'Specialty chemicals': { opportunity: 'Local formulation and distribution', benefit: 'Explore blending, formulation and packaging for regional industrial and construction customers.', risk: 'Confirm process-specific environmental requirements, hazardous storage and feedstock contracts.', evidence: ['production', 'customs', 'energy'] },
    'Healthcare & life sciences': { opportunity: 'Distribution before manufacturing', benefit: 'Evaluate qualified storage and regional distribution as an entry step before regulated production.', risk: 'Confirm product-specific authorisations, quality systems and temperature-control requirements.', evidence: ['production', 'customs', 'tax'] },
    'Other manufacturing': { opportunity: 'A regional operation to validate', benefit: 'Compare a distribution or finishing hub with your existing operation before committing to a factory.', risk: 'Your manufacturing process needs a sector-specific cost model and approval assessment.', evidence: ['production', 'customs', 'energy'] },
};
export function insights(i: Inputs) {
    const sector = sectorNotes[i.industry];
    const market = i.gulfShare >= 60 ? 'Strong regional-market alignment' : i.gulfShare >= 30 ? 'Mixed-market opportunity' : 'Validate regional demand first';
    const marketDetail = i.gulfShare >= 60 ? `${i.gulfShare}% of your target sales are in the Gulf. A local operation may reduce delivery distance and make service easier.` : i.gulfShare >= 30 ? `With ${i.gulfShare}% Gulf sales, compare a smaller regional hub with full production. Keep European freight in the calculation.` : `Only ${i.gulfShare}% of your target sales are in the Gulf. Confirm new regional orders before choosing local manufacturing.`;
    const route = i.stage === 'New venture' ? 'Pilot processing or distribution' : i.scale === 'pilot' || i.budget < 1600000 ? 'Distribution or a pilot facility' : i.gulfShare >= 60 && i.budget >= 3600000 ? 'Assess full manufacturing' : 'Start with processing or assembly';
    const next = [`Request a written activity and facility assessment for ${i.industry.toLowerCase()}.`, i.audience === 'Government & utilities' ? 'Confirm tender qualification and local-content requirements with the intended buyers.' : i.audience === 'Retail & consumers' ? 'Validate packaging, labelling and product approvals for your retail channels.' : i.audience === 'Distributors & wholesalers' ? 'Seek distributor commitments and agree stock, delivery and credit terms.' : 'Secure industrial buyer specifications, qualification requirements and indicative orders.', `Obtain delivered input quotes from ${i.origin.toLowerCase()} and compare at least two freight routes.`, i.goal === 'Reduce delivered cost' ? 'Build a quoted cost baseline without assuming rebates, then test eligibility separately.' : i.goal === 'Move closer to raw materials' ? 'Confirm input grades, availability and the process that creates value locally.' : i.goal === 'Build regional capacity' ? 'Phase capacity against committed orders and verify utility loads before signing a lease.' : 'Validate regional demand with customers before selecting the facility size.'];
    return { sector, market, marketDetail, route, next, hasCostModel: hasCostModel(i) };
}
