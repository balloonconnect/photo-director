'use client';
import { AppProvider } from '@/lib/client/app';
import Shell from '@/components/Shell';

export default function Page() {
  return (<AppProvider><Shell /></AppProvider>);
}
