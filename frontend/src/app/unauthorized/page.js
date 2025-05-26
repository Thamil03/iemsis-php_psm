'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Unauthorized() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600 mb-4">
          You are not authorized to access this page. Please log in to continue.
        </p>
        <p className="text-gray-500 text-sm">
          You will be redirected to the home page in 3 seconds...
        </p>
        <Link 
          href="/"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Click here to go to home page
        </Link>
      </div>
    </div>
  );
} 