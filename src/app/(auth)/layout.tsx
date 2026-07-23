import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import { getServerAuthToken } from '@/libs/server-auth';
import { ToastProvider } from '@/components/RealtimeToast';

export const metadata: Metadata = {
  title: 'APILens App',
  description: 'Protected APILens workspace',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    // ... add more open graph meta tags
  },
};

export default async function AuthLayout({
  children,
}: {
  children: Readonly<React.ReactNode>;
}) {
  const token = await getServerAuthToken();

  if (!token) redirect('/');

  return (
    <ToastProvider>
      <div className="min-h-screen w-full">{children}</div>
    </ToastProvider>
  );
}


