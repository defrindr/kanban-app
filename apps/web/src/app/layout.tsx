import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '@/shared/components/toast-container';

export const metadata: Metadata = {
  title: 'KanbanPro',
  description: 'Collaborative Kanban Board',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              const dark = localStorage.getItem('kanban-dark-mode')
              if (dark === 'true' || (!dark && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              }
            } catch (e) {}
          `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
