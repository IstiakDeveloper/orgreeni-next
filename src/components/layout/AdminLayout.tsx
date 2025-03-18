import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will now handle its own visibility */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 md:ml-64 p-4">
        {children}
      </main>
    </div>
  );
}