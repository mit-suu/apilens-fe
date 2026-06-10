import StartAnalyzingView from './start-view';
import { getServerCurrentUser } from '@/libs/server-auth';
import { redirect } from 'next/navigation';

export default async function StartAnalyzingPage() {
  const user = await getServerCurrentUser();

  if (!user) redirect('/');

  return <StartAnalyzingView user={user} />;
}
