'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, parseJwtPayload } from '@/stores/authStore';

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setSession, clearSession } = useAuthStore();

  // On mount: if no in-memory token, try to refresh using the HTTP-only cookie
  useEffect(() => {
    if (isAuthenticated()) return;

    fetch('/api/auth/refresh', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.accessToken) {
          const user = parseJwtPayload(data.accessToken);
          if (user) { setSession(data.accessToken, user); return; }
        }
        clearSession();
        router.replace('/login');
      })
      .catch(() => { clearSession(); router.replace('/login'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
