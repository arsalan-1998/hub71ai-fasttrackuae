import { z } from 'zod';
import { inputSchema, type Inputs } from './model.ts';
import { questionnaireSchema } from './profile.ts';
export type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const completedSchema = z.object({version:z.literal(1),inputs:inputSchema,scenarioId:z.string().optional(),updatedAt:z.number()});
const draftSchema = z.object({version:z.literal(1),form:questionnaireSchema.extend({company:z.string().max(100),country:z.string().max(80)}),finance:z.object({funding:z.string().max(80),baselineAnnual:z.string().max(80),localAnnual:z.string().max(80),ramp:z.string().max(80),discount:z.string().max(80)}),financeChanged:z.boolean(),baseInputs:inputSchema.optional(),scenarioId:z.string().optional(),step:z.number().int().min(0).max(3),updatedAt:z.number()});
export type LocalAssessment = z.infer<typeof completedSchema>;
export type LocalDraft = z.infer<typeof draftSchema>;
const key=(scope:string,kind:string)=>`factory-fit:v1:${encodeURIComponent(scope)}:${kind}`;
function browserStorage():StoragePort|null {try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
function read<S extends z.ZodTypeAny>(scope:string|null|undefined,kind:string,schema:S,storage:StoragePort|null):z.output<S>|null {
 if(!scope||!storage)return null;
 try {const raw=storage.getItem(key(scope,kind));if(!raw)return null;const parsed=schema.safeParse(JSON.parse(raw));return parsed.success?parsed.data:null;}catch{return null;}
}
export function readAssessment(scope?:string|null,storage:StoragePort|null=browserStorage()) {return read(scope,'assessment',completedSchema,storage);}
export function readDraft(scope?:string|null,storage:StoragePort|null=browserStorage()) {return read(scope,'draft',draftSchema,storage);}
function write(scope:string|null|undefined,kind:string,value:unknown,storage:StoragePort|null) {if(!scope||!storage)return false;try{storage.setItem(key(scope,kind),JSON.stringify(value));return true;}catch{return false;}}
export function saveAssessment(scope:string|null|undefined,inputs:Inputs,scenarioId?:string,storage:StoragePort|null=browserStorage()) {
 if(!inputs.onboardingComplete)return true; // Example companies must never replace a real assessment.
 const parsed=completedSchema.safeParse({version:1,inputs,scenarioId,updatedAt:Date.now()});
 return parsed.success&&write(scope,'assessment',parsed.data,storage);
}
export function saveDraft(scope:string|null|undefined,draft:Omit<LocalDraft,'version'|'updatedAt'>,storage:StoragePort|null=browserStorage()) {
 const parsed=draftSchema.safeParse({...draft,version:1,updatedAt:Date.now()});
 return parsed.success&&write(scope,'draft',parsed.data,storage);
}
export function removeDraft(scope:string|null|undefined,storage:StoragePort|null=browserStorage()) {if(!scope||!storage)return false;try{storage.removeItem(key(scope,'draft'));return true;}catch{return false;}}
export function clearAssessment(scope:string|null|undefined,storage:StoragePort|null=browserStorage()) {if(!scope||!storage)return false;try{storage.removeItem(key(scope,'assessment'));storage.removeItem(key(scope,'draft'));return true;}catch{return false;}}
export function canRestore(local:LocalAssessment|LocalDraft|null,scenarioId?:string) {return !!local&&(!scenarioId||local.scenarioId===scenarioId);}
export function assessmentEditUrl(scenarioId?:string) {return scenarioId?'/get-started?scenario='+encodeURIComponent(scenarioId)+'&step=financial':'/get-started?step=financial';}
