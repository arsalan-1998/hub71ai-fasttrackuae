import { z } from 'zod';
import type { Inputs, Scenario } from './model.ts';
export const financialSchema = z.object({
 mode: z.enum(['detailed','annual-totals']).optional(),
 machinery: z.number().min(0).max(1e9), premises: z.number().min(0).max(1e9), approvals: z.number().min(0).max(1e8), workingCapital: z.number().min(0).max(1e9), contingency: z.number().min(0).max(100), discount: z.number().min(0).max(100), ramp: z.number().min(0).max(100), price: z.number().min(0).max(1e6).nullable(), baselineVariable: z.number().min(0).max(1e6), localVariable: z.number().min(0).max(1e6), baselineFixed: z.number().min(0).max(1e9), localFixed: z.number().min(0).max(1e9), recoverWorkingCapital: z.boolean(), basis: z.enum(['illustrative','user-entered'])
});
export type Financial = z.infer<typeof financialSchema>;
export function defaultFinancial(s: Scenario, baseline: Scenario, output: number): Financial {
 const fixed = (r: Scenario) => r.costs.find(c => c.name === 'Fixed operations')!.value * output;
 return { machinery:s.capex*.7,premises:s.capex*.27,approvals:s.capex*.03,workingCapital:400000,contingency:10,discount:10,ramp:50,price:null,baselineVariable:baseline.unitCost-fixed(baseline)/output,localVariable:s.unitCost-fixed(s)/output,baselineFixed:fixed(baseline),localFixed:fixed(s),recoverWorkingCapital:false,basis:'illustrative' };
}
export function projectFinance(raw: Financial, output: number, budget: number) {
 const f=financialSchema.parse(raw);
 const setup=f.machinery+f.premises+f.approvals, reserve=setup*f.contingency/100, funding=setup+reserve+f.workingCapital;
 const margin=f.baselineVariable-f.localVariable, fixedDelta=f.baselineFixed-f.localFixed;
 const annualSavings=margin*output+fixedDelta;
 let cumulative=-funding;
 const cashflows=[{year:0,label:'Now',cash:-funding,cumulative,output:0}];
 let payback:number|null=null;
 for(let year=1;year<=5;year++) {
  const produced=output*(year===1?f.ramp/100:year===2?(1+f.ramp/100)/2:1);
  const cash=margin*produced+fixedDelta+(year===5&&f.recoverWorkingCapital?f.workingCapital:0);
  const before=cumulative; cumulative+=cash;
  if(payback===null&&before<0&&cumulative>=0&&cash>0) payback=year-1+(-before/cash);
  cashflows.push({year,label:`Y${year}`,cash,cumulative,output:produced});
 }
 const npv=cashflows.reduce((sum,row)=>sum+row.cash/(1+f.discount/100)**row.year,0);
 const contribution=f.price===null?null:f.price-f.localVariable;
 return {funding,reserve,annualSavings,cashflows,npv,roi:funding>0?cumulative/funding*100:null,payback,breakEven:f.mode!=='annual-totals'&&contribution!==null&&contribution>0?Math.ceil(f.localFixed/contribution):null,fundingGap:Math.max(0,funding-budget),output};
}
export function analyticsFor(inputs: Inputs, s: Scenario, baseline: Scenario) {
 const output=inputs.volume*inputs.utilization/100;
 const f=inputs.financial??defaultFinancial(s,baseline,output);
 return {financial:f,...projectFinance(f,output,inputs.budget)};
}

export const quickFinancialSchema = z.object({
 funding: z.number().min(0).max(1e9), baselineAnnual: z.number().min(0).max(1e9), localAnnual: z.number().min(0).max(1e9), ramp: z.number().min(0).max(100), discount: z.number().min(0).max(100)
});
export type QuickFinancial = z.infer<typeof quickFinancialSchema>;
export function quickFinancial(raw: QuickFinancial, output: number): Financial {
 const q = quickFinancialSchema.parse(raw);
 if (!Number.isFinite(output) || output <= 0) throw new Error('Positive output required');
 return financialSchema.parse({machinery:q.funding,premises:0,approvals:0,workingCapital:0,contingency:0,discount:q.discount,ramp:q.ramp,price:null,baselineVariable:q.baselineAnnual/output,localVariable:q.localAnnual/output,baselineFixed:0,localFixed:0,recoverWorkingCapital:false,basis:'user-entered',mode:'annual-totals'});
}
