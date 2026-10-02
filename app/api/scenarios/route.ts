import { database } from '@/db/store';
import { inputSchema } from '@/lib/model';
const owner = (r: Request) => r.headers.get('oai-authenticated-user-id');
export async function GET(request: Request) { const user = owner(request); if (!user)
    return Response.json({ error: 'Sign in to access your saved scenarios.' }, { status: 401 }); try {
    const result = await database().prepare('SELECT id, name, inputs, created_at FROM scenarios WHERE owner_id = ? ORDER BY created_at DESC LIMIT 50').bind(user).all();
    return Response.json({ scenarios: result.results.map(r => ({ ...r, inputs: JSON.parse(r.inputs as string) })) });
}
catch {
    return Response.json({ error: 'Saved scenarios could not be loaded. Please try again.' }, { status: 503 });
} }
export async function POST(request: Request) { const user = owner(request); if (!user)
    return Response.json({ error: 'Sign in to save this scenario.' }, { status: 401 }); const payload = await request.json().catch(() => null) as {
    inputs?: unknown;
} | null; const parsed = inputSchema.safeParse(payload?.inputs); if (!parsed.success)
    return Response.json({ error: 'Please check the scenario inputs.' }, { status: 400 }); try {
    const id = crypto.randomUUID(), created = Date.now();
    await database().prepare('INSERT INTO scenarios (id, owner_id, name, inputs, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, user, parsed.data.company, JSON.stringify(parsed.data), created).run();
    return Response.json({ id, name: parsed.data.company, inputs: parsed.data, created_at: created }, { status: 201 });
}
catch {
    return Response.json({ error: 'Unable to save. Your inputs are still here; please try again.' }, { status: 503 });
} }
