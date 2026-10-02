import type { ReactNode } from 'react';
export function Panel({ children, className = '', ...props }: {
    children: ReactNode;
    className?: string;
    id?: string;
}) { return <section className={`panel ${className}`} {...props}>{children}</section>; }
export function SectionTitle({ eyebrow, title, action }: {
    eyebrow?: string;
    title: string;
    action?: ReactNode;
}) { return <div className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>; }
export function Badge({ children, tone = 'neutral' }: {
    children: ReactNode;
    tone?: 'neutral' | 'blue' | 'green' | 'amber';
}) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Field({ label, children }: {
    label: string;
    children: ReactNode;
}) { return <label className="field"><span>{label}</span>{children}</label>; }
export function RangeField({ label, value, min, max, step = 1, display, onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    display: string;
    onChange: (v: number) => void;
}) { return <label className="range-field"><span>{label}<strong>{display}</strong></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/><div className="range-bounds"><span>{min.toLocaleString()}</span><span>{max.toLocaleString()}</span></div></label>; }
