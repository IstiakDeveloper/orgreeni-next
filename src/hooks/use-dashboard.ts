// src/hooks/use-dashboard.ts
import { useState, useEffect } from 'react';
import DashboardService from '@/services/dashboard-service';
import { 
  DashboardResponse, 
  SalesChartResponse,
  SalesChartData 
} from '@/types/dashboard';

export function useDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardResponse['data']>({
    overall: {
      total_orders: 0,
      total_customers: 0,
      total_products: 0,
      total_revenue: 0
    },
    today: {
      orders: 0,
      revenue: 0,
      new_customers: 0
    },
    monthly: {
      orders: 0,
      revenue: 0,
      new_customers: 0
    },
    pending_orders: [],
    low_stock_products: [],
    unread_messages: [],
    order_status_distribution: {}
  });

  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const statsResponse = await DashboardService.getDashboardStats();
      const chartResponse = await DashboardService.getSalesChart(chartPeriod);

      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }

      if (chartResponse.success) {
        setSalesChartData(chartResponse.data.chart_data);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [chartPeriod]);

  return {
    dashboardStats,
    salesChartData,
    isLoading,
    chartPeriod,
    setChartPeriod,
    fetchDashboardData
  };
}