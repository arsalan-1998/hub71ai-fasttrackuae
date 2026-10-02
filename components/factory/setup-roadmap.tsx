import { Panel, Badge, SectionTitle } from './primitives';
import { evidence } from '@/lib/evidence';
const steps = [
 ['Feasibility & customer validation','1–4','Investment lead','Start','Demand commitments, product specifications, current-base cost evidence','polymers'],
 ['Entity, activity & premises review','3–8','Legal lead / zone','Feasibility','Activity classification, site offers, lease and utility capacity','production'],
 ['Process & approval design','6–14','Engineering / authorities','Premises shortlist','Process drawings, safety and environmental requirements confirmed for your activity','production'],
 ['Fit-out & machinery installation','12–28','Engineering / suppliers','Approved designs','Equipment quotes, delivery schedule, contractor scope, inspection requirements','customs'],
 ['Recruitment & commissioning','24–34','Operations lead','Installation readiness','Skills plan, trial runs, quality validation, applicable approvals','production'],
 ['Production & market launch','32–40','Plant lead / sales','Commissioning sign-off','Required production permissions, customer acceptance, distribution contracts','production'],
];
export function SetupRoadmap(){return <Panel className="analytics-roadmap"><SectionTitle title="From decision to production" eyebrow="SETUP ROADMAP" action={<Badge tone="amber">Illustrative 40-week plan</Badge>}/><p className="analytics-note">Overlapping planning windows from project start, not authority processing commitments. Confirm product-specific requirements, sequencing and lead times with your advisers and suppliers.</p><div className="setup-table"><table><thead><tr><th>Phase / planning window</th><th>Owner / dependency</th><th>Evidence to unlock next step</th></tr></thead><tbody>{steps.map(([title,weeks,owner,after,required,source],i)=><tr key={title}><td><strong>0{i+1} · {title}</strong><span>Weeks {weeks}</span></td><td>{owner}<span>After: {after}</span></td><td>{required}<a href={evidence.find(e=>e.id===source)?.url} target="_blank" rel="noreferrer">Related public source ↗</a></td></tr>)}</tbody></table></div></Panel>}
