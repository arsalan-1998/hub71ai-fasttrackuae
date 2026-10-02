'use client';
import { useState } from 'react';
import { BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart3, ArrowDownToLine } from 'lucide-react';
import { type Inputs, DEMO } from '@/lib/model';
import { investmentFor } from '@/lib/investment';
import { AnalyticsDashboard } from './analytics-dashboard';
import { Panel, SectionTitle, Badge } from './primitives';
import { Button } from '@/components/ui/button';
import { SetupRoadmap } from './setup-roadmap';
const charts=[['Investment breakdown','Funding by category'],['Five-year cumulative cash flow','Year'],['Home country vs Abu Dhabi costs','Cost category'],['Downside / base / upside ROI','Scenario'],['NPV sensitivity','Assumption']];
export function FinancialWorkspace({inputs,onChange,onAnalyze,onEditAssessment}:{inputs:Inputs;onChange:(i:Inputs)=>void;onAnalyze:(inputs?:Inputs)=>void;onEditAssessment:()=>void}) {
 const [example,setExample]=useState(false);
 if (example) return <div className="analytics-workspace"><Panel className="example-banner"><Badge tone="amber">Example only · fictional Nordline Polymers</Badge><p>These graphs demonstrate the calculation. They are not projections for {inputs.company} or benchmarks for {inputs.country}.</p><Button variant="outline" onClick={()=>setExample(false)}>Return to my company</Button></Panel><ExampleAnalytics onAnalyze={onAnalyze}/></div>;
 if (investmentFor(inputs)) return <AnalyticsDashboard key={inputs.company+inputs.country+(inputs.financialRoute??'manufacturing')} inputs={inputs} onChange={onChange} onAnalyze={onAnalyze} onEditAssessment={onEditAssessment}/>;
 return <div className="analytics-workspace">
 <Panel className="analytics-intro"><div><p className="eyebrow">INVESTMENT & SETUP ANALYTICS</p><h2>{inputs.company} · {inputs.country} → Abu Dhabi</h2><p>Your analytical dashboard is ready. Complete the three investment questions in your assessment to calculate your returns.</p></div><Badge tone="amber">Financial inputs needed</Badge></Panel>
 <div className="analytics-kpis">{['Total funding','Annual operating savings','5-year investment ROI','Payback','Net present value','Operating break-even','Funding gap'].map(label=><Panel className="kpi" key={label}><span>{label}</span><strong>—</strong><small>{label==='Operating break-even'?'Requires selling price and operating costs':'Awaiting your financial inputs'}</small></Panel>)}</div>
 <Panel className="finance-prompt"><div><strong>No cost benchmark is loaded for your {inputs.country} company.</strong><p>Your profile is retained. Add three cost estimates in your assessment, or explore the labelled example.</p></div><div><Button onClick={onEditAssessment}><ArrowDownToLine size={16}/>Complete investment assessment</Button><Button variant="outline" onClick={()=>setExample(true)}><BarChart3 size={16}/>View example graphs</Button></div></Panel>
 <div className="analytics-charts">{charts.map(([title,axis])=><Panel className="analytics-chart empty-chart" key={title}><SectionTitle title={title}/><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={[]}><CartesianGrid strokeDasharray="3 3"/><XAxis label={{value:axis,position:'insideBottom',offset:-2}}/><YAxis tick={false}/><ReferenceLine y={0}/></BarChart></ResponsiveContainer><div className="empty-chart-message"><BarChart3 size={24}/><strong>Awaiting cost inputs</strong><span>Calculated values will appear here</span></div></div></Panel>)}</div>
 <SetupRoadmap/>
 </div>;
}
function ExampleAnalytics({onAnalyze}:{onAnalyze:(inputs?:Inputs)=>void}) {
 const [inputs,setInputs]=useState<Inputs>(DEMO);
 return <AnalyticsDashboard inputs={inputs} onChange={setInputs} onAnalyze={onAnalyze} onEditAssessment={()=>window.location.assign('/get-started')}/>;
}
