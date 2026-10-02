'use client';
import { useEffect, useState } from 'react';
import { Building2, Factory, Globe2, Target, Check, Loader2, Info } from 'lucide-react';
import { SiteHeader } from './site-header';
import { industries, audiences, goals, origins, scales, questionnaireSchema, type Questionnaire } from '@/lib/profile';
import { fromQuestionnaire } from '@/lib/personalization';
import { type Inputs } from '@/lib/model';
import { quickFinancial } from '@/lib/analytics';
import { readAssessment, readDraft, saveAssessment, saveDraft, removeDraft, clearAssessment, canRestore } from '@/lib/local-assessment';
import { StartNewAssessment } from './start-new-assessment';
import { AssessmentFinance, blankFinance, type FinanceDraft } from './assessment-finance';
const steps = [{ title: 'Your company', icon: Building2 }, { title: 'Manufacturing', icon: Factory }, { title: 'Your customers', icon: Globe2 }, { title: 'Investment & goals', icon: Target }];
const initial: Questionnaire = { company: '', country: 'Germany', industry: 'Polymers & plastics', stage: 'Existing company', scale: 'medium', audience: 'Industrial buyers', goal: 'Reach Gulf customers', origin: 'UAE', gulfShare: 60, budget: 4000000, product: 'Telecom ducts' };
export function Onboarding({initialInputs, startAtFinancial=false, initialError='',storageScope,scenarioId,fresh=false}:{initialInputs?:Inputs;startAtFinancial?:boolean;initialError?:string;storageScope?:string|null;scenarioId?:string;fresh?:boolean}) {
    const [baseInputs,setBaseInputs]=useState(initialInputs),[activeId,setActiveId]=useState(scenarioId),[storageReady,setStorageReady]=useState(false),[localStatus,setLocalStatus]=useState('');
    const existing=baseInputs?.financial;
    const output=baseInputs ? baseInputs.volume*baseInputs.utilization/100 : 0;
    const seed: FinanceDraft=existing ? {funding:String(existing.machinery+existing.premises+existing.approvals+existing.workingCapital+(existing.machinery+existing.premises+existing.approvals)*existing.contingency/100),baselineAnnual:String(Math.round(existing.baselineVariable*output+existing.baselineFixed)),localAnnual:String(Math.round(existing.localVariable*output+existing.localFixed)),ramp:String(existing.ramp),discount:String(existing.discount)} : blankFinance;
    const [finance,setFinance]=useState<FinanceDraft>(seed),[financeChanged,setFinanceChanged]=useState(false);
    const [form, setForm] = useState<Questionnaire>(initialInputs??initial), [step, setStep] = useState(startAtFinancial?3:0), [error, setError] = useState(initialError), [busy, setBusy] = useState(false);
    useEffect(()=>{
        if(fresh) {
            clearAssessment(storageScope);
            window.history.replaceState(null,'','/get-started');
        } else if(!initialError) {
            const draft=readDraft(storageScope);
            const completed=readAssessment(storageScope);
            if(canRestore(draft,scenarioId)) {
                setForm(draft!.form);setFinance(draft!.finance);setFinanceChanged(draft!.financeChanged);
                setBaseInputs(draft!.baseInputs??initialInputs);setActiveId(draft!.scenarioId);
                setStep(startAtFinancial?3:draft!.step);
            } else if(canRestore(completed,scenarioId)) {
                const cached=completed!.inputs;
                setForm(cached);setBaseInputs(cached);setActiveId(completed!.scenarioId);
                const f=cached.financial,q=cached.volume*cached.utilization/100;
                if(f) setFinance({funding:String(f.machinery+f.premises+f.approvals+f.workingCapital+(f.machinery+f.premises+f.approvals)*f.contingency/100),baselineAnnual:String(Math.round(f.baselineVariable*q+f.baselineFixed)),localAnnual:String(Math.round(f.localVariable*q+f.localFixed)),ramp:String(f.ramp),discount:String(f.discount)});
            }
        }
        setStorageReady(true);
    },[storageScope,scenarioId,fresh,initialError,initialInputs,startAtFinancial]);
    useEffect(()=>{
        if(!storageReady||initialError)return;
        const ok=saveDraft(storageScope,{form,finance,financeChanged,baseInputs,scenarioId:activeId,step});
        setLocalStatus(ok?'Answers saved on this device':'Browser saving is unavailable');
    },[form,finance,financeChanged,baseInputs,activeId,step,storageReady,storageScope,initialError]);
    function update<K extends keyof Questionnaire>(key: K, value: Questionnaire[K]) { setForm(f => ({ ...f, [key]: value })); setError(''); }
    function next() { if (step === 0 && (form.company.trim().length < 2 || form.country.trim().length < 2)) {
        setError('Enter your company name and home country to continue.');
        return;
    } setStep(s => s + 1); setError(''); }
    async function submit() { const parsed = questionnaireSchema.safeParse(form); if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
    } setBusy(true); setError(''); try {
        let inputs = fromQuestionnaire(parsed.data);
        if(baseInputs) inputs={...baseInputs,...parsed.data,volume:baseInputs.scale===parsed.data.scale?baseInputs.volume:inputs.volume,material:baseInputs.origin===parsed.data.origin?baseInputs.material:inputs.material,onboardingComplete:true};
        const amounts=[finance.funding,finance.baselineAnnual,finance.localAnnual];
        if(amounts.some(v=>v.trim()!=='')) {
            if(amounts.some(v=>v.trim()==='')) throw new Error('Enter all three financial amounts, or leave all three blank.');
            if(finance.ramp.trim()===''||finance.discount.trim()==='') throw new Error('Enter the ramp-up and discount percentages.');
            if(!existing||financeChanged||existing.mode==='annual-totals') inputs={...inputs,financial:quickFinancial({funding:Number(finance.funding),baselineAnnual:Number(finance.baselineAnnual),localAnnual:Number(finance.localAnnual),ramp:Number(finance.ramp),discount:Number(finance.discount)},inputs.volume*inputs.utilization/100),financialRoute:'manufacturing'};
        } else inputs={...inputs,financial:undefined};
        const r = await fetch('/api/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs }) });
        const data = await r.json() as {
            id?: string;
            error?: string;
        };
        if (!r.ok || !data.id)
            throw new Error(data.error || 'The assessment could not be saved.');
        saveAssessment(storageScope,inputs,data.id);removeDraft(storageScope);
        window.location.assign('/dashboard?scenario=' + encodeURIComponent(data.id));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to create your assessment. Your answers are preserved.');
        setBusy(false);
    } }
    if(!storageReady)return <div className="landing onboarding"><SiteHeader/><div className="assessment-restoring" role="status"><Loader2 className="spin" size={22}/><p>Restoring your answers…</p></div></div>;
    return <div className="landing onboarding"><SiteHeader /><main className="onboarding-main"><div className="onboarding-intro"><span className="landing-kicker">A BETTER DECISION STARTS WITH YOUR BUSINESS</span><h1>Let’s find your Abu Dhabi fit.</h1><p>A few details help us tailor the opportunities, tradeoffs and next steps.</p></div><div className="onboarding-layout"><aside className="onboarding-sidebar"><ol>{steps.map((s, i) => <li className={i === step ? 'current' : i < step ? 'completed' : ''} key={s.title}><span>{i < step ? <Check size={18}/> : <s.icon size={19}/>}</span><div><small>STEP {i + 1}</small><strong>{s.title}</strong></div></li>)}</ol><div className="onboarding-side-note"><Info size={20}/><p>Your answers shape the assessment. Supplier prices, approvals and incentives still need verification.</p></div><a href="/">Back to overview</a></aside><section className="questionnaire"><div className="assessment-local-controls"><span className="browser-save-status" role="status">{localStatus}</span><StartNewAssessment storageScope={storageScope} variant="assessment"/></div><div className="question-progress"><span>STEP {step + 1} OF 4</span><div>{steps.map((_, i) => <i key={i} className={i <= step ? 'filled' : ''}/>)}</div></div><h2>{['Tell us about your company.', 'What does your operation look like?', 'Who do you want to reach?', 'What would make the move worthwhile?'][step]}</h2><p className="question-subtitle">{['We’ll use this to understand your starting point.', 'Choose the closest fit. You can refine the assumptions later.', 'Your customer mix is a key part of the relocation decision.', 'Your goal, available budget and three cost estimates shape your investment forecast.'][step]}</p>
 <form onSubmit={e => { e.preventDefault(); if (step < 3)
        next();
    else
        void submit(); }}>
 {step === 0 && <div className="question-fields"><label>Company name<input autoComplete="organization" value={form.company} maxLength={100} placeholder="e.g. Nordline Polymers" onChange={e => update('company', e.target.value)} required minLength={2}/></label><label>Current or planned home country<select value={['Germany', 'Italy', 'Poland', 'France', 'United Kingdom', 'Netherlands', 'Kazakhstan', 'Uzbekistan', 'Saudi Arabia', 'United Arab Emirates'].includes(form.country) ? form.country : 'Other'} onChange={e => update('country', e.target.value === 'Other' ? '' : e.target.value)}>{['Germany', 'Italy', 'Poland', 'France', 'United Kingdom', 'Netherlands', 'Kazakhstan', 'Uzbekistan', 'Saudi Arabia', 'United Arab Emirates', 'Other'].map(c => <option key={c}>{c}</option>)}</select></label>{!['Germany', 'Italy', 'Poland', 'France', 'United Kingdom', 'Netherlands', 'Kazakhstan', 'Uzbekistan', 'Saudi Arabia', 'United Arab Emirates'].includes(form.country) && <label>Specify home country<input value={form.country} onChange={e => update('country', e.target.value)} required minLength={2}/></label>}<fieldset><legend>Where are you starting from?</legend><div className="choice-row">{(['Existing company', 'New venture'] as const).map(v => <label className={form.stage === v ? 'choice selected' : 'choice'} key={v}><input type="radio" name="stage" value={v} checked={form.stage === v} onChange={() => update('stage', v)}/><Building2 size={20}/><strong>{v}</strong><span>{v === 'Existing company' ? 'Explore a branch or relocation' : 'Assess a new manufacturing business'}</span></label>)}</div></fieldset></div>}
 {step === 1 && <div className="question-fields"><label>Industry<select value={form.industry} onChange={e => update('industry', e.target.value as Questionnaire['industry'])}>{industries.map(v => <option key={v}>{v}</option>)}</select></label>{form.industry === 'Polymers & plastics' && <label>Closest product category<select value={form.product} onChange={e => update('product', e.target.value as Questionnaire['product'])}>{['Telecom ducts', 'Irrigation pipes', 'Industrial packaging'].map(v => <option key={v}>{v}</option>)}</select></label>}<fieldset><legend>Manufacturing scale</legend><p className="field-help">Annual capacity, or your planned starting capacity.</p><div className="scale-grid">{scales.map(s => <label key={s.id} className={form.scale === s.id ? 'choice selected' : 'choice'}><input type="radio" name="scale" value={s.id} checked={form.scale === s.id} onChange={() => update('scale', s.id)}/><strong>{s.label}</strong><span>{form.industry === 'Polymers & plastics' ? s.detail : ({ pilot: 'Trial production or early commercial launch', small: 'A focused production operation', medium: 'Several established production lines', large: 'A substantial industrial operation' }[s.id])}</span></label>)}</div></fieldset><label>Where do your main raw materials come from?<select value={form.origin} onChange={e => update('origin', e.target.value as Questionnaire['origin'])}>{origins.map(v => <option key={v}>{v}</option>)}</select></label></div>}
 {step === 2 && <div className="question-fields"><label>Primary customer type<select value={form.audience} onChange={e => update('audience', e.target.value as Questionnaire['audience'])}>{audiences.map(v => <option key={v}>{v}</option>)}</select></label><label className="question-range"><span>Expected sales to Gulf customers<strong>{form.gulfShare}%</strong></span><input aria-label="Expected sales to Gulf customers" type="range" min={0} max={100} step={5} value={form.gulfShare} onChange={e => update('gulfShare', Number(e.target.value))}/><div><span>Mostly other markets</span><span>Mostly Gulf markets</span></div></label><div className="question-info"><Globe2 size={24}/><p>{form.gulfShare >= 60 ? 'Regional demand may strengthen the case for local production or distribution. Confirm it with customer commitments.' : form.gulfShare >= 30 ? 'A phased regional hub may be worth comparing with full manufacturing.' : 'Your current base may remain attractive. We’ll highlight the demand you need to validate before expanding.'}</p></div></div>}
 {step === 3 && <div className="question-fields"><label>Your main expansion goal<select value={form.goal} onChange={e => update('goal', e.target.value as Questionnaire['goal'])}>{goals.map(v => <option key={v}>{v}</option>)}</select></label><label>Indicative setup investment budget (USD)<select value={form.budget} onChange={e => update('budget', Number(e.target.value))}>{![300000,1000000,2500000,4000000,7500000].includes(form.budget)&&<option value={form.budget}>${form.budget.toLocaleString()} · your available budget</option>}{[{ v: 300000, t: 'Under $500,000 · planning assumption: $300,000' }, { v: 1000000, t: '$500,000–$1.5m · assumption: $1m' }, { v: 2500000, t: '$1.5m–$3m · assumption: $2.5m' }, { v: 4000000, t: '$3m–$5m · assumption: $4m' }, { v: 7500000, t: 'Over $5m · assumption: $7.5m' }].map(o => <option key={o.v} value={o.v}>{o.t}</option>)}</select></label><AssessmentFinance value={finance} onChange={v=>{setFinance(v);setFinanceChanged(true);setError('');}}/><div className="assessment-review"><h3>Your assessment will include</h3><ul><li><Check size={16}/>Investment KPIs and five-year return charts</li><li><Check size={16}/>Industry and customer-specific opportunities</li><li><Check size={16}/>Relevant sources and a setup roadmap</li></ul><p>Financial projections use your estimates and disclosed assumptions. They are not supplier quotations or verified returns.</p></div></div>}
 {error && <div className="question-error" role="alert"><Info size={18}/>{error}</div>}
 <div className="question-actions">{step > 0 ? <button className="site-button secondary" type="button" onClick={() => { setStep(s => s - 1); setError(''); }} disabled={busy}>Back</button> : <span />}<button className="site-button" type="submit" disabled={busy}>{busy ? <><Loader2 className="spin" size={17}/>Creating assessment…</> : step === 3 ? 'See my assessment' : 'Continue'}</button></div></form>
 </section></div><p className="onboarding-bottom">Your answers are remembered in this browser, and completed assessments are saved privately to your account.</p></main></div>;
}
