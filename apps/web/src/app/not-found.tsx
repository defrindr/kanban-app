import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Page Not Found</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            My Boards
          </Link>
        </div>
      </div>
    </div>
  );
}
