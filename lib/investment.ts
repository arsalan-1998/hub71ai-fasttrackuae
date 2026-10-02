import { calculate, type Inputs } from './model.ts';
import { hasCostModel } from './personalization.ts';
import { analyticsFor, projectFinance } from './analytics.ts';
export function investmentFor(inputs: Inputs) {
 if (inputs.financial) return { financial: inputs.financial, ...projectFinance(inputs.financial, inputs.volume * inputs.utilization / 100, inputs.budget) };
 if (!hasCostModel(inputs)) return null;
 const results = calculate(inputs);
 return analyticsFor(inputs, results.find(s => s.id === (inputs.financialRoute ?? 'manufacturing'))!, results[0]);
}
