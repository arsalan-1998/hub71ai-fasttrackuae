import { z } from 'zod';
export const industries = ['Polymers & plastics', 'Food & ingredients', 'Metals & components', 'Industrial equipment', 'Specialty chemicals', 'Healthcare & life sciences', 'Other manufacturing'] as const;
export const audiences = ['Industrial buyers', 'Distributors & wholesalers', 'Retail & consumers', 'Government & utilities'] as const;
export const goals = ['Reach Gulf customers', 'Reduce delivered cost', 'Move closer to raw materials', 'Build regional capacity'] as const;
export const origins = ['UAE', 'Saudi Arabia', 'Central Asia', 'Europe', 'Multiple regions'] as const;
export const scales = [
    { id: 'pilot', label: 'Pilot / early stage', detail: 'Under 1,000 tonnes per year', volume: 500 },
    { id: 'small', label: 'Small operation', detail: '1,000–5,000 tonnes per year', volume: 2500 },
    { id: 'medium', label: 'Medium operation', detail: '5,000–20,000 tonnes per year', volume: 10000 },
    { id: 'large', label: 'Large operation', detail: 'Over 20,000 tonnes per year', volume: 25000 },
] as const;
export const profileFields = {
    industry: z.enum(industries).default('Polymers & plastics'),
    audience: z.enum(audiences).default('Industrial buyers'),
    goal: z.enum(goals).default('Reach Gulf customers'),
    origin: z.enum(origins).default('UAE'),
    stage: z.enum(['Existing company', 'New venture']).default('Existing company'),
    scale: z.enum(['pilot', 'small', 'medium', 'large']).default('medium'),
    onboardingComplete: z.boolean().default(false),
};
export const questionnaireSchema = z.object({
    company: z.string().trim().min(2, 'Enter at least two characters.').max(100),
    country: z.string().trim().min(2, 'Choose your current or planned home country.').max(80),
    industry: z.enum(industries), audience: z.enum(audiences), goal: z.enum(goals), origin: z.enum(origins),
    stage: z.enum(['Existing company', 'New venture']), scale: z.enum(['pilot', 'small', 'medium', 'large']),
    gulfShare: z.number().min(0).max(100), budget: z.number().min(0).max(100000000),
    product: z.enum(['Telecom ducts', 'Irrigation pipes', 'Industrial packaging']),
});
export type Questionnaire = z.infer<typeof questionnaireSchema>;
