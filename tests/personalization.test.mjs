import test from 'node:test';
import assert from 'node:assert/strict';
import { fromQuestionnaire, hasCostModel, insights } from '../lib/personalization.ts';
import { inputSchema, DEMO } from '../lib/model.ts';
const questionnaire={company:'Test Foods',country:'Germany',industry:'Food & ingredients',stage:'Existing company',scale:'small',audience:'Distributors & wholesalers',goal:'Move closer to raw materials',origin:'Central Asia',gulfShare:75,budget:1000000,product:'Telecom ducts'};
test('questionnaire answers survive validation and stored JSON round-trip',()=>{
 const result=inputSchema.parse(JSON.parse(JSON.stringify(fromQuestionnaire(questionnaire))));
 for(const key of ['company','country','industry','stage','scale','audience','goal','origin','gulfShare','budget'])assert.equal(result[key],questionnaire[key]);
 assert.equal(result.volume,2500);assert.equal(result.material,'Kazakhstan');assert.equal(result.incentive,false);assert.equal(result.onboardingComplete,true);
});
test('unsupported sectors and countries never receive the plastics cost model',()=>{
 assert.equal(hasCostModel(fromQuestionnaire(questionnaire)),false);
 assert.equal(hasCostModel({...DEMO,country:'France'}),false);
 assert.equal(hasCostModel({...DEMO,origin:'Europe'}),false);
 assert.equal(hasCostModel({...DEMO,stage:'New venture'}),false);
 assert.equal(hasCostModel(DEMO),true);
});
test('customer market, audience, goal and sector change the assessment',()=>{
 const i=fromQuestionnaire(questionnaire);const p=insights(i);
 assert.equal(p.market,'Strong regional-market alignment');
 assert.equal(p.sector.opportunity,'Processing and regional packing');
 assert.ok(p.next.some(n=>n.includes('distributor')));
 assert.ok(p.next.some(n=>n.includes('input grades')));
 assert.equal(insights({...i,gulfShare:10}).market,'Validate regional demand first');
 assert.ok(insights({...i,audience:'Government & utilities'}).next.some(n=>n.includes('tender')));
});
test('new ventures start with a pilot path and do not inherit an existing-plant baseline',()=>{
 const i=fromQuestionnaire({...questionnaire,stage:'New venture'});
 assert.equal(insights(i).route,'Pilot processing or distribution');assert.equal(hasCostModel(i),false);
});
test('existing saved scenarios remain readable after the profile extension',()=>{
 const {industry,audience,goal,origin,stage,scale,onboardingComplete,...old}=DEMO;
 const result=inputSchema.parse(old);assert.equal(result.industry,'Polymers & plastics');assert.equal(result.onboardingComplete,false);
});
