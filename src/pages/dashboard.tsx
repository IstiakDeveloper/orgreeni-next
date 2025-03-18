// src/pages/dashboard.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Dynamically import components to ensure client-side rendering
const DashboardContent = dynamic(() => import('@/components/dashboard/DashboardContent'), {
  loading: () => (
    <div className="flex justify-center items-center h-full">
      <Loader2 className="animate-spin w-12 h-12" />
    </div>
  ),
  ssr: false
});

export default function DashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}