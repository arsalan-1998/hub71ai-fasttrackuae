'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Factory, LayoutDashboard, BookOpen, GitBranch, Bookmark, Download, Save, RotateCcw, Globe2, Info, Sparkles, ExternalLink, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, SectionTitle, Badge } from './primitives';
import { calculate, DEMO, inputSchema, recommend, type Inputs } from '@/lib/model';
import { evidence } from '@/lib/evidence';
import { hasCostModel, insights } from '@/lib/personalization';
import { AssessmentSummary } from './assessment-summary';
import { FinancialWorkspace } from './financial-workspace';
import { SetupRoadmap } from './setup-roadmap';
import { readAssessment, readDraft, saveAssessment, canRestore, assessmentEditUrl } from '@/lib/local-assessment';
import { StartNewAssessment } from './start-new-assessment';
import { Brand } from './brand';
import { investmentFor } from '@/lib/investment';
type Tab = 'workspace' | 'evidence' | 'approvals' | 'saved';
type Saved = {
    id: string;
    name: string;
    inputs: Inputs;
    created_at: number;
};
type Analysis = {
    summary: string;
    findings: {
        text: string;
        sourceIds: string[];
    }[];
    assumptions: string[];
    questions: string[];
};
const nav = [{ id: 'workspace' as Tab, label: 'Analytical dashboard', icon: LayoutDashboard }, { id: 'evidence' as Tab, label: 'Evidence library', icon: BookOpen }, { id: 'approvals' as Tab, label: 'Setup roadmap', icon: GitBranch }, { id: 'saved' as Tab, label: 'Saved scenarios', icon: Bookmark }];
export function Dashboard({ initialInputs = DEMO, initialError = "", storageScope, scenarioId }: {
    initialInputs?: Inputs;
    initialError?: string;
    storageScope?: string|null;
    scenarioId?: string;
}) {
    const [inputs, setInputs] = useState<Inputs>(initialInputs), [tab, setTab] = useState<Tab>('workspace'), [notice, setNotice] = useState(initialError), [saving, setSaving] = useState(false), [saved, setSaved] = useState<Saved[]>([]), [loadingSaved, setLoadingSaved] = useState(false), [query, setQuery] = useState(''), [category, setCategory] = useState('All'), [analyzing, setAnalyzing] = useState(false), [analysis, setAnalysis] = useState<Analysis | null>(null), [showAnalysis, setShowAnalysis] = useState(false);
    const [storageReady,setStorageReady]=useState(false),[activeId,setActiveId]=useState(scenarioId),[localStatus,setLocalStatus]=useState('');
    const demoBackup=useRef<Inputs|null>(null);
    useEffect(()=>{
        if(!initialError) {
            const local=readAssessment(storageScope);
            if(canRestore(local,scenarioId)) {setInputs(local!.inputs);setActiveId(local!.scenarioId);}
            else if(!scenarioId&&readDraft(storageScope)){window.location.replace('/get-started');return;}
        }
        setStorageReady(true);
    },[storageScope,scenarioId,initialError]);
    useEffect(()=>{
        if(!storageReady||initialError||!inputs.onboardingComplete)return;
        setLocalStatus(saveAssessment(storageScope,inputs,activeId)?'Remembered on this device':'Browser saving is unavailable');
    },[inputs,activeId,storageReady,storageScope,initialError]);
    function showExample() {
        if(demoBackup.current){setInputs(demoBackup.current);demoBackup.current=null;setNotice('Your company assessment restored.');}
        else {demoBackup.current=inputs;setInputs(DEMO);setNotice('Viewing an example. Your remembered assessment is unchanged.');}
        setAnalysis(null);setTab('workspace');
    }
    const supported = hasCostModel(inputs);
    const profile = insights(inputs);
    const results = useMemo(() => calculate(inputs), [inputs]);
    const decision = useMemo(() => recommend(inputs), [inputs]);
    
    useEffect(() => {
        if (!notice)
            return;
        const timer = setTimeout(() => setNotice(''), 6500);
        return () => clearTimeout(timer);
    }, [notice]);
    async function loadSaved() {
        setLoadingSaved(true);
        try {
            const r = await fetch('/api/scenarios');
            const data = await r.json() as {
                error?: string;
                scenarios: Saved[];
                analysis: Analysis;
            };
            if (!r.ok)
                throw new Error(data.error);
            setSaved(data.scenarios);
        }
        catch (e) {
            setNotice(e instanceof Error ? e.message : 'Unable to load scenarios.');
        }
        finally {
            setLoadingSaved(false);
        }
    }
    useEffect(() => {
        if (tab === 'saved')
            void loadSaved();
    }, [tab]);
    async function save() {
        setSaving(true);
        try {
            const r = await fetch('/api/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs }) });
            const data = await r.json() as {
                error?: string;
                scenarios: Saved[];
                analysis: Analysis;
                id?: string;
            };
            if (!r.ok)
                throw new Error(data.error);
            if(data.id && inputs.onboardingComplete){setActiveId(data.id);window.history.replaceState(null,'','/dashboard?scenario='+encodeURIComponent(data.id));}
            setNotice('Scenario saved. Find it in Saved scenarios.');
        }
        catch (e) {
            setNotice(e instanceof Error ? e.message : 'Could not save.');
        }
        finally {
            setSaving(false);
        }
    }
    async function analyze(analysisInputs: Inputs = inputs) {
        setShowAnalysis(true);
        setAnalyzing(true);
        try {
            const r = await fetch('/api/analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: analysisInputs }) });
            const data = await r.json() as {
                error?: string;
                scenarios: Saved[];
                analysis: Analysis;
            };
            if (!r.ok)
                throw new Error(data.error);
            setAnalysis(data.analysis);
        }
        catch (e) {
            setNotice(e instanceof Error ? e.message : 'Analysis unavailable.');
        }
        finally {
            setAnalyzing(false);
        }
    }
    function editAssessment() {
        window.location.assign(inputs.onboardingComplete?assessmentEditUrl(activeId):'/get-started');
    }
    function exportReport() { const payload = { title: 'MAD — Manufacturing in Abu Dhabi — decision summary', generatedAt: new Date().toISOString(), status: 'Illustrative pre-tax model; no supplier quotations', inputs, results: supported ? results : [], companyAssessment: profile, recommendation: supported ? decision.best.name : profile.route, investmentAnalytics: investmentFor(inputs), aiAnalysis: analysis, evidence }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mad-decision-summary.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Decision summary exported with inputs, results and evidence.'); }
    if(!storageReady) return <div className="app-shell"><div className="assessment-restoring" role="status"><Loader2 className="spin" size={22}/><p>Restoring your assessment…</p></div></div>;
    return <div className="app-shell">
 <aside className="sidebar"><Brand variant="sidebar" /><div className="workspace-label">YOUR WORKSPACE</div><nav>{nav.map(n => <button key={n.id} onClick={() => setTab(n.id)} className={tab === n.id ? 'nav-item active' : 'nav-item'}><n.icon size={18}/>{n.label}{n.id === 'evidence' && <span className="nav-count">8</span>}</button>)}</nav><div className="sidebar-note"><div className="note-icon"><Globe2 size={22}/></div><h3>A local branch.<br />A wider opportunity.</h3><p>Explore the economics before committing to a new factory.</p><button onClick={showExample}>{demoBackup.current?'Return to my company':'Load example company'} <RotateCcw size={14}/></button></div><div className="sidebar-footer"><span className="avatar">MAD</span><div>Private workspace<small>Manufacturing intelligence</small></div></div></aside>
 <div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{nav.find(n => n.id === tab)?.label}</strong><a href="/" className="dashboard-overview">Overview</a></div><div className="topbar-right"><Badge tone="blue">Abu Dhabi, UAE</Badge><span className="avatar small">AD</span></div></header>
 <main><div className="page-heading"><div><p className="eyebrow">MANUFACTURING · LOGISTICS · INVESTMENT</p><h1>{tab === 'workspace' ? inputs.onboardingComplete ? 'Your investment, explained.' : 'Investment & setup analytics.' : tab === 'evidence' ? 'Decisions backed by evidence.' : tab === 'approvals' ? 'Know what comes next.' : 'Your investment scenarios.'}</h1><p>{tab === 'workspace' ? `Compare your ${inputs.country} base with an Abu Dhabi operation.` : tab === 'evidence' ? 'Public sources, conditions and the questions still worth asking.' : tab === 'approvals' ? 'A planning sequence to verify with the relevant authorities.' : 'Revisit the assumptions behind each investment decision.'}</p></div><div className="heading-actions"><StartNewAssessment storageScope={storageScope}/><Button variant="outline" onClick={exportReport}><Download />Export summary</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="spin"/> : <Save />}Save scenario</Button></div></div>
 {localStatus&&<p className="browser-save-status" role="status">{localStatus}</p>}
 <div className="mobile-nav">{nav.map(n => <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => setTab(n.id)}><n.icon size={17}/><span>{n.label.replace('Investment ', '').replace(' library', '').replace(' scenarios', '')}</span></button>)}</div>
 {notice && <div role="status" className="toast"><Info size={18}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16}/></button></div>}
 {tab === 'workspace' && <>
 {initialError && <div className="question-error" role="alert">{initialError} <a href="/get-started">Start a new assessment</a></div>}
 <FinancialWorkspace key={inputs.company+inputs.country} inputs={inputs} onChange={i=>{setInputs(i);setAnalysis(null);}} onAnalyze={analyze} onEditAssessment={()=>void editAssessment()}/>
 {inputs.onboardingComplete && <details className="company-assessment-details"><summary>Company assessment, market fit & next steps</summary><AssessmentSummary inputs={inputs}/></details>}
 </>}
 {tab === 'evidence' && <><Panel className="filter-panel"><input aria-label="Search evidence" placeholder="Search sources, requirements or suppliers…" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="Evidence category" value={category} onChange={e => setCategory(e.target.value)}>{['All', ...new Set(evidence.map(e => e.category))].map(v => <option key={v}>{v}</option>)}</select><Badge>{evidence.filter(e => (category === 'All' || e.category === category) && `${e.title} ${e.summary} ${e.publisher}`.toLowerCase().includes(query.toLowerCase())).length} sources</Badge></Panel><div className="evidence-grid">{evidence.filter(e => (category === 'All' || e.category === category) && `${e.title} ${e.summary} ${e.publisher}`.toLowerCase().includes(query.toLowerCase())).map(e => <Panel key={e.id} className="evidence-card"><div className="scenario-top"><Badge tone="blue">{e.category}</Badge><span className="verified"><CheckCircle2 size={15}/>Public source</span></div><h2>{e.title}</h2><p>{e.summary}</p><div className="conditions"><strong>What to verify</strong><p>{e.conditions}</p></div><div className="evidence-card-footer"><div>{e.publisher}<small>Checked {e.checked}</small></div><a href={e.url} target="_blank" rel="noreferrer" aria-label={`Open ${e.title}`}><ExternalLink size={18}/></a></div></Panel>)}</div>{!evidence.some(e => (category === 'All' || e.category === category) && `${e.title} ${e.summary} ${e.publisher}`.toLowerCase().includes(query.toLowerCase())) && <Panel className="empty-state"><BookOpen /><h2>No matching evidence</h2><p>Try another keyword or category.</p></Panel>}</>}
 {tab === 'approvals' && <SetupRoadmap/>}
 {tab === 'saved' && <>{loadingSaved ? <Panel className="empty-state"><Loader2 className="spin"/><h2>Loading your scenarios…</h2></Panel> : saved.length ? <div className="evidence-grid">{saved.map(s => <Panel className="saved-card" key={s.id}><Bookmark size={24}/><h2>{s.name}</h2><p>{s.inputs.industry} · {s.inputs.country} → Abu Dhabi</p><p>{hasCostModel(s.inputs) ? `${s.inputs.volume.toLocaleString()} tonnes / year` : `${s.inputs.scale} operation`} · {s.inputs.gulfShare}% Gulf customers</p><small>Saved {new Date(s.created_at).toLocaleString()}</small><Button onClick={() => {
                        const parsed = inputSchema.safeParse(s.inputs);
                        if (parsed.success) {
                            setInputs(parsed.data);
                            setActiveId(s.id);demoBackup.current=null;
                            window.history.replaceState(null,'','/dashboard?scenario='+encodeURIComponent(s.id));
                            setTab('workspace');
                            setAnalysis(null);
                            setNotice('Saved scenario loaded.');
                        }
                        else
                            setNotice('This scenario needs updated inputs.');
                    }}>Open comparison</Button></Panel>)}</div> : <Panel className="empty-state"><Bookmark size={35}/><h2>Keep the decisions worth revisiting.</h2><p>Save your current comparison to preserve its assumptions and return to it later.</p><Button onClick={() => setTab('workspace')}>Open workspace</Button></Panel>}</>}
 <footer>MAD <span>Built for informed expansion.</span><span>USD · public evidence checked 02 Oct 2026</span></footer>
 </main></div>

 {showAnalysis && <div className="modal-backdrop"><Panel className="modal"><SectionTitle title="Evidence-based AI analysis" action={<button aria-label="Close AI analysis" onClick={() => setShowAnalysis(false)}><X /></button>}/>{analyzing ? <p><Loader2 className="spin inline"/>Reviewing your scenario and source records…</p> : analysis ? <><p>{analysis.summary}</p>{analysis.findings.map((f, i) => <div className="analysis-finding" key={i}><p>{f.text}</p>{f.sourceIds.map(id => { const e = evidence.find(e => e.id === id); return e ? <a key={id} href={e.url} target="_blank" rel="noreferrer">{e.publisher} <ExternalLink size={12}/></a> : null; })}</div>)}<h3>Assumptions</h3><ul>{analysis.assumptions.map(a => <li key={a}>{a}</li>)}</ul><h3>Questions to resolve</h3><ul>{analysis.questions.map(a => <li key={a}>{a}</li>)}</ul></> : <div className="empty-state"><Sparkles size={32}/><h2>AI connection pending</h2><p>An administrator needs to enable the OpenAI connection. Your financial comparison and public evidence are available now.</p><Button variant="outline" onClick={() => { setShowAnalysis(false); setTab('evidence'); }}>Explore evidence</Button></div>}</Panel></div>}
 </div>;
}
