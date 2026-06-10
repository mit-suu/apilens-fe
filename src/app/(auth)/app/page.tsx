import { getServerCurrentUser } from '@/libs/server-auth';
import { redirect } from 'next/navigation';
import RepoPicker from './repo-picker';

export default async function AppPage() {
  const user = await getServerCurrentUser();

  if (!user) redirect('/');

  return <RepoPicker user={user} />;
}
