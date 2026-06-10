import ResultDashboard from './view';
import { getServerCurrentUser } from '@/libs/server-auth';
import { redirect } from 'next/navigation';

export default async function AnalysisResultPage() {
  const user = await getServerCurrentUser();

  if (!user) redirect('/');

  return <ResultDashboard user={user} />;
}
