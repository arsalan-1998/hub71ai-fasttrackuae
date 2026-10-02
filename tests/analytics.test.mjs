import test from 'node:test';
import assert from 'node:assert/strict';
import { projectFinance, financialSchema, analyticsFor } from '../lib/analytics.ts';
import { calculate, DEMO, inputSchema } from '../lib/model.ts';
const f={machinery:1000,premises:0,approvals:0,workingCapital:200,contingency:10,discount:10,ramp:50,price:null,baselineVariable:10,localVariable:5,baselineFixed:100,localFixed:100,recoverWorkingCapital:false,basis:'user-entered'};
test('funding, ramp cash flows, NPV and ROI reconcile independently',()=>{
 const a=projectFinance(f,100,1000);
 assert.equal(a.funding,1300);assert.equal(a.fundingGap,300);
 assert.deepEqual(a.cashflows.map(r=>r.cash),[-1300,250,375,500,500,500]);
 assert.equal(a.payback,3.35);
 assert.equal(a.roi,(2125-1300)/1300*100);
 const expected=-1300+250/1.1+375/1.1**2+500/1.1**3+500/1.1**4+500/1.1**5;
 assert.ok(Math.abs(a.npv-expected)<1e-8);assert.equal(a.breakEven,null);
});
test('selling price is required and negative contribution has no break-even',()=>{
 assert.equal(projectFinance({...f,price:7},100,0).breakEven,50);
 assert.equal(projectFinance({...f,price:4},100,0).breakEven,null);
});
test('working capital recovery is explicit and only added in year 5',()=>{
 const base=projectFinance(f,100,0),recovery=projectFinance({...f,recoverWorkingCapital:true},100,0);
 assert.equal(recovery.cashflows[5].cash-base.cashflows[5].cash,200);
 assert.equal(recovery.cashflows[1].cash,base.cashflows[1].cash);
});
test('unprofitable investment has no recovery and zero funding has no ROI',()=>{
 assert.equal(projectFinance({...f,localVariable:20},100,0).payback,null);
 assert.equal(projectFinance({...f,machinery:0,workingCapital:0},100,0).roi,null);
});
test('financial assumptions validate and survive scenario serialization',()=>{
 assert.equal(financialSchema.safeParse({...f,ramp:101}).success,false);
 assert.equal(financialSchema.safeParse({...f,localVariable:NaN}).success,false);
 const saved=inputSchema.parse(JSON.parse(JSON.stringify({...DEMO,financial:f,financialRoute:'processing'})));
 assert.deepEqual(saved.financial,f);assert.equal(saved.financialRoute,'processing');
});
test('illustrative steady state reconciles with underlying cost comparison',()=>{
 const r=calculate(DEMO),a=analyticsFor(DEMO,r[2],r[0]);
 assert.ok(Math.abs(a.annualSavings-r[2].savings)<.01);
 assert.equal(a.financial.price,null);
});

test('France profile is accepted for explicit financial modelling without plastics benchmarks', async()=>{
 const { investmentFor }=await import('../lib/investment.ts');
 const france=inputSchema.parse({...DEMO,country:'France',company:'IJ Galaxy',financial:f,volume:100,utilization:100});
 const a=investmentFor(france);
 assert.equal(a.funding,1300);assert.equal(a.annualSavings,500);
 assert.equal(a.financial.basis,'user-entered');
});
test('unbenchmarked countries and sectors require costs rather than silently inventing them',async()=>{
 const { investmentFor }=await import('../lib/investment.ts');
 assert.equal(investmentFor({...DEMO,country:'France'}),null);
 assert.equal(investmentFor({...DEMO,industry:'Food & ingredients'}),null);
 assert.equal(investmentFor({...DEMO,stage:'New venture'}),null);
});
test('explicit costs also work for new ventures and different sectors',async()=>{
 const { investmentFor }=await import('../lib/investment.ts');
 const a=investmentFor({...DEMO,country:'France',industry:'Food & ingredients',stage:'New venture',financial:f,volume:100,utilization:100});
 assert.equal(a.annualSavings,500);assert.equal(a.funding,1300);
});

test('three annual totals produce the same funding and steady-state savings without invented categories',async()=>{
 const {quickFinancial}=await import('../lib/analytics.ts');
 const q=quickFinancial({funding:300000,baselineAnnual:1000000,localAnnual:850000,ramp:50,discount:10},400);
 const a=projectFinance(q,400,250000);
 assert.equal(a.funding,300000);assert.equal(a.annualSavings,150000);assert.equal(a.fundingGap,50000);
 assert.equal(a.cashflows[1].cash,75000);assert.equal(a.cashflows[2].cash,112500);
 assert.equal(q.mode,'annual-totals');assert.equal(q.baselineFixed,0);assert.equal(q.localFixed,0);
 assert.equal(a.breakEven,null);assert.equal(q.premises+q.approvals+q.workingCapital,0);
});
test('quick estimates survive saving and preserve total costs at the selected output',async()=>{
 const {quickFinancial}=await import('../lib/analytics.ts');
 const {investmentFor}=await import('../lib/investment.ts');
 const inputs=inputSchema.parse({...DEMO,country:'France',volume:500,utilization:80,financial:quickFinancial({funding:300000,baselineAnnual:1000000,localAnnual:850000,ramp:50,discount:10},400)});
 const saved=inputSchema.parse(JSON.parse(JSON.stringify(inputs)));
 assert.equal(investmentFor(saved).annualSavings,150000);assert.equal(saved.financial.mode,'annual-totals');
});
test('quick financial inputs reject missing, negative and invalid percentages',async()=>{
 const {quickFinancialSchema,quickFinancial}=await import('../lib/analytics.ts');
 assert.equal(quickFinancialSchema.safeParse({funding:300000,baselineAnnual:1e6,ramp:50,discount:10}).success,false);
 assert.throws(()=>quickFinancial({funding:-1,baselineAnnual:1e6,localAnnual:8e5,ramp:50,discount:10},400));
 assert.throws(()=>quickFinancial({funding:1,baselineAnnual:1,localAnnual:1,ramp:101,discount:10},400));
 assert.throws(()=>quickFinancial({funding:1,baselineAnnual:1,localAnnual:1,ramp:50,discount:10},0));
});
