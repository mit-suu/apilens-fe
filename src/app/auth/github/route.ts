import { getBackendAuthUrl } from '@/libs/env';
import { redirect } from 'next/navigation';

export function GET() {
  redirect(getBackendAuthUrl('/auth/github'));
}
