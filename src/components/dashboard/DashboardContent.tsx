import React from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Loader2 } from 'lucide-react';

export default function DashboardContent() {
  const { 
    dashboardStats, 
    salesChartData, 
    isLoading, 
    chartPeriod,
    setChartPeriod 
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-12 h-12" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        {/* Rest of the dashboard content remains the same */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(dashboardStats.overall).map(([key, value]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{key.replace(/_/g, ' ').toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {/* Ensure safe rendering */}
                  {value !== undefined && value !== null ? value.toLocaleString() : 'N/A'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Similar modifications for other parts of the dashboard */}
      </div>
    </ProtectedRoute>
  );
}