'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateStoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct create story page
    router.replace('/stories/new');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to create story...</p>
      </div>
    </div>
  );
}
