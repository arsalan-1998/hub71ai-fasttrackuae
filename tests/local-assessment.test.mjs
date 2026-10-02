import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO } from '../lib/model.ts';
import { quickFinancial } from '../lib/analytics.ts';
import { investmentFor } from '../lib/investment.ts';
import { readAssessment, readDraft, saveAssessment, saveDraft, removeDraft, clearAssessment, canRestore } from '../lib/local-assessment.ts';
const memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const company={...DEMO,company:'IJ Galaxy',country:'France',onboardingComplete:true,financial:quickFinancial({funding:300000,baselineAnnual:1000000,localAnnual:850000,ramp:50,discount:10},4800)};
const draft={form:{...company,company:'I',country:''},finance:{funding:'300',baselineAnnual:'',localAnnual:'850000',ramp:'50',discount:'10'},financeChanged:true,baseInputs:company,step:3,scenarioId:'saved-france'};
test('completed financial inputs restore and reproduce the same results',()=>{
 const storage=memory();assert.equal(saveAssessment('owner',company,'saved-france',storage),true);
 const restored=readAssessment('owner',storage);assert.equal(restored.inputs.company,'IJ Galaxy');
 assert.deepEqual(investmentFor(restored.inputs),investmentFor(company));assert.equal(restored.scenarioId,'saved-france');
});
test('unfinished drafts preserve partial text, amounts, step and detailed base inputs',()=>{
 const storage=memory();assert.equal(saveDraft('owner',draft,storage),true);
 const restored=readDraft('owner',storage);assert.equal(restored.form.company,'I');assert.equal(restored.form.country,'');assert.equal(restored.finance.baselineAnnual,'');assert.equal(restored.step,3);assert.deepEqual(restored.baseInputs,company);
});
test('explicit routes restore only the matching scenario',()=>{
 assert.equal(canRestore({scenarioId:'one'},'two'),false);assert.equal(canRestore({scenarioId:'one'},'one'),true);assert.equal(canRestore({scenarioId:'one'}),true);assert.equal(canRestore(null,'one'),false);
});
test('example views cannot replace the saved real company',()=>{
 const storage=memory();saveAssessment('owner',company,'saved-france',storage);saveAssessment('owner',DEMO,undefined,storage);
 assert.equal(readAssessment('owner',storage).inputs.company,'IJ Galaxy');
});
test('deletion clears both records and does not affect another account or other application data',()=>{
 const storage=memory();saveAssessment('owner',company,undefined,storage);saveDraft('owner',draft,storage);saveAssessment('other',company,undefined,storage);storage.setItem('unrelated','keep');
 assert.equal(clearAssessment('owner',storage),true);assert.equal(readAssessment('owner',storage),null);assert.equal(readDraft('owner',storage),null);assert.ok(readAssessment('other',storage));assert.equal(storage.getItem('unrelated'),'keep');
});
test('draft removal after completion preserves the completed assessment',()=>{
 const storage=memory();saveDraft('owner',draft,storage);saveAssessment('owner',company,'saved-france',storage);removeDraft('owner',storage);
 assert.equal(readDraft('owner',storage),null);assert.ok(readAssessment('owner',storage));
});
test('malformed, unsupported or invalid records and blocked storage fail without throwing',()=>{
 const storage=memory();const key='factory-fit:v1:owner:assessment';
 for(const raw of ['{bad',JSON.stringify({version:2,inputs:company}),JSON.stringify({version:1,inputs:{...company,volume:0},updatedAt:1})]){storage.setItem(key,raw);assert.equal(readAssessment('owner',storage),null);}
 const blocked={getItem(){throw new Error('blocked')},setItem(){throw new Error('full')},removeItem(){throw new Error('blocked')}};
 assert.equal(readAssessment('owner',blocked),null);assert.equal(readDraft('owner',blocked),null);assert.equal(saveAssessment('owner',company,undefined,blocked),false);assert.equal(saveDraft('owner',draft,blocked),false);assert.equal(clearAssessment('owner',blocked),false);
});
test('server rendering and missing identity never access browser storage',()=>{
 assert.equal(readAssessment(),null);assert.equal(readDraft(),null);
 const storage=memory();assert.equal(saveAssessment(null,company,undefined,storage),false);assert.equal(storage.data.size,0);
});

test('leaving and reopening an assessment reuses its ID and restores unfinished financial edits',async()=>{
 const {assessmentEditUrl}=await import('../lib/local-assessment.ts');
 const storage=memory();saveAssessment('owner',company,'saved-france',storage);
 const firstRoute=new URL(assessmentEditUrl('saved-france'),'https://example.test');
 const edited={...draft,finance:{...draft.finance,funding:'350000'},scenarioId:firstRoute.searchParams.get('scenario')};
 saveDraft('owner',edited,storage);
 const active=readAssessment('owner',storage);
 const secondRoute=new URL(assessmentEditUrl(active.scenarioId),'https://example.test');
 const resumed=readDraft('owner',storage);
 assert.equal(canRestore(resumed,secondRoute.searchParams.get('scenario')),true);assert.equal(resumed.finance.funding,'350000');assert.equal(resumed.step,3);
});
