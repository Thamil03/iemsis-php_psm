'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Unauthorized from '@/app/unauthorized/page';

export default function AuthMiddleware({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for root page
      if (pathname === '/') {
        setIsLoading(false);
        setIsAuthorized(true);
        return;
      }

      try {
        const res = await fetch('http://157.230.245.190:8000/auth/session.php', {
          credentials: 'include',
        });
        const data = await res.json();
        
        setIsAuthorized(data.loggedIn);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized && pathname !== '/') {
    return <Unauthorized />;
  }

  return children;
} 