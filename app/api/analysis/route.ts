import { env } from 'cloudflare:workers';
import { inputSchema, calculate } from '@/lib/model';
import { hasCostModel, insights } from '@/lib/personalization';
import { investmentFor } from '@/lib/investment';
import { evidence } from '@/lib/evidence';
export async function POST(request: Request) {
    if (!request.headers.get('oai-authenticated-user-id'))
        return Response.json({ error: 'Sign in to request an analysis.' }, { status: 401 });
    const config = env as unknown as {
        OPENAI_API_KEY?: string;
        OPENAI_MODEL?: string;
    };
    if (!config.OPENAI_API_KEY || !config.OPENAI_MODEL)
        return Response.json({ error: 'AI analysis is not connected yet. An administrator must enable the OpenAI connection. The financial comparison remains available.' }, { status: 503 });
    const payload = await request.json().catch(() => null) as {
        inputs?: unknown;
    } | null;
    const parsed = inputSchema.safeParse(payload?.inputs);
    if (!parsed.success)
        return Response.json({ error: 'Please check your inputs.' }, { status: 400 });
    const schema = { type: 'object', additionalProperties: false, properties: { summary: { type: 'string' }, findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { text: { type: 'string' }, sourceIds: { type: 'array', items: { type: 'string', enum: evidence.map(e => e.id) } } }, required: ['text', 'sourceIds'] } }, assumptions: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'findings', 'assumptions', 'questions'] };
    try {
        const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Authorization': `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.OPENAI_MODEL, store: false, instructions: 'You are a manufacturing expansion analyst. Use only provided evidence. All financial figures are illustrative assumptions, not quotations. Never invent regulatory requirements or company intentions. Cite findings with supplied sourceIds. Do not claim definitive investment or tax advice. Identify missing evidence. Do not recalculate supplied results.', input: JSON.stringify({ inputs: parsed.data, results: hasCostModel(parsed.data) ? calculate(parsed.data) : [], investmentAnalytics: investmentFor(parsed.data), companyAssessment: insights(parsed.data), evidence }), text: { format: { type: 'json_schema', name: 'factory_analysis', strict: true, schema } }, max_output_tokens: 2000 }), signal: AbortSignal.timeout(45000) });
        if (!response.ok)
            throw new Error('Upstream unavailable');
        const body = await response.json() as {
            output?: {
                content?: {
                    type: string;
                    text?: string;
                }[];
            }[];
        };
        const text = body.output?.flatMap(o => o.content ?? []).filter(c => c.type === 'output_text').map(c => c.text ?? '').join('');
        if (!text)
            throw new Error('No analysis');
        return Response.json({ analysis: JSON.parse(text) });
    }
    catch {
        return Response.json({ error: 'The AI analysis could not be completed. Please try again; your comparison is preserved.' }, { status: 502 });
    }
}
