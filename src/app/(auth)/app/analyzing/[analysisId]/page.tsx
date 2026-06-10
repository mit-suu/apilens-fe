import AnalyzingView from './view';
import { getServerCurrentUser } from '@/libs/server-auth';
import { redirect } from 'next/navigation';

export default async function AnalyzingPage() {
  const user = await getServerCurrentUser();

  if (!user) redirect('/');

  return <AnalyzingView user={user} />;
}
