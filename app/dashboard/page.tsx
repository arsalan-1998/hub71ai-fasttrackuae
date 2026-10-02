import { headers } from 'next/headers';
import { Dashboard } from '@/components/factory/dashboard';
import { database } from '@/db/store';
import { inputSchema } from '@/lib/model';
export const dynamic = 'force-dynamic';
export default async function DashboardPage({ searchParams }: {
    searchParams: Promise<{
        scenario?: string;
    }>;
}) {
    const { scenario } = await searchParams;
    const user = (await headers()).get('oai-authenticated-user-id');
    if (!scenario) return <Dashboard storageScope={user}/>;
    try {
        if (!user)
            return <Dashboard storageScope={user} scenarioId={scenario} initialError="Sign in to load your company assessment."/>;
        const row = await database().prepare('SELECT inputs FROM scenarios WHERE id = ? AND owner_id = ?').bind(scenario, user).first<{
            inputs: string;
        }>();
        if (!row)
            return <Dashboard storageScope={user} scenarioId={scenario} initialError="This assessment is unavailable or belongs to another user. Start a new assessment."/>;
        const result = inputSchema.safeParse(JSON.parse(row.inputs));
        if (!result.success)
            return <Dashboard storageScope={user} scenarioId={scenario} initialError="This assessment needs updated company details. Start a new assessment."/>;
        return <Dashboard initialInputs={result.data} storageScope={user} scenarioId={scenario}/>;
    }
    catch {
        return <Dashboard storageScope={user} scenarioId={scenario} initialError="Your assessment could not be loaded. Please retry or start a new assessment."/>;
    }
}
