'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/ui/Loader';
import LoginPage from '@/components/auth/LoginPage';
import SetupWrapper from '@/components/Setup/SetupWrapper';
import Sidebar from '@/components/Sidebar';
import { ChatProvider } from '@/lib/hooks/useChat';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  const isAuthRoute = pathname?.startsWith('/login');
  const isSetupRoute = pathname?.startsWith('/setup');

  useEffect(() => {
    // Check if setup is complete
    fetch('/api/auth/setup-status')
      .then((r) => r.json())
      .then((d) => setSetupComplete(d.setupComplete))
      .catch(() => setSetupComplete(true));
  }, []);

  if (loading || setupComplete === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Not logged in → login page (unless already on login/setup)
  if (!user && !isAuthRoute && !isSetupRoute) {
    return <LoginPage />;
  }

  // If setup not complete → show setup wizard (even for logged in users)
  if (!setupComplete) {
    return <SetupWrapper />;
  }

  // Setup complete and logged in → show main app
  return (
    <ChatProvider>
      <Sidebar>{children}</Sidebar>
    </ChatProvider>
  );
}
