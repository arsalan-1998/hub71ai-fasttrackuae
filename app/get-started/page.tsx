import { headers } from 'next/headers';
import { Onboarding } from '@/components/factory/onboarding';
import { database } from '@/db/store';
import { inputSchema } from '@/lib/model';
export const dynamic='force-dynamic';
export default async function GetStartedPage({searchParams}:{searchParams:Promise<{scenario?:string;step?:string;fresh?:string}>}) {
 const {scenario,step,fresh}=await searchParams;
 const user=(await headers()).get('oai-authenticated-user-id');
 if(fresh==='1') return <Onboarding storageScope={user} fresh/>;
 if(!scenario) return <Onboarding storageScope={user} startAtFinancial={step==='financial'}/>;
 try {
  if(!user) throw new Error('Sign in to edit your assessment.');
  const row=await database().prepare('SELECT inputs FROM scenarios WHERE id = ? AND owner_id = ?').bind(scenario,user).first<{inputs:string}>();
  if(!row) throw new Error('Your assessment could not be found.');
  const inputs=inputSchema.parse(JSON.parse(row.inputs));
  return <Onboarding initialInputs={inputs} startAtFinancial={step==='financial'} storageScope={user} scenarioId={scenario}/>;
 } catch {return <Onboarding storageScope={user} scenarioId={scenario} initialError="This saved assessment could not be loaded. Please return to your dashboard and try again."/>;}
}
