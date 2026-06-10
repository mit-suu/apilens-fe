import { getServerCurrentUser } from '@/libs/server-auth';
import { redirect } from 'next/navigation';
import HistoryView from './view';

export default async function HistoryPage() {
  const user = await getServerCurrentUser();

  if (!user) redirect('/');

  return <HistoryView user={user} />;
}
