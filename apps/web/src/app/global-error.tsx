'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body className="bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white">Oops!</h1>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Something went wrong</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              {error.message || 'An unexpected error occurred. Please try again later.'}
            </p>

            {error.digest && <p className="text-xs text-gray-500 dark:text-gray-500">Error ID: {error.digest}</p>}

            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
