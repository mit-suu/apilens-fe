/**
 * Server entry point for the AI Fix Compare page.
 * The page.tsx is a server component that wraps the client view.
 * Data (originalCode, fixedCode, smell, score) is loaded via sessionStorage
 * on the client side (passed from the Analysis Detail page).
 */
import CompareView from './view';
import { getServerCurrentUser } from '@/libs/server-auth';
import { redirect } from 'next/navigation';

export default async function AiFixComparePage() {
  const user = await getServerCurrentUser();
  if (!user) redirect('/');
  return <CompareView user={user} />;
}
