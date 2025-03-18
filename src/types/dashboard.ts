// src/types/dashboard.ts
export interface OverallStats {
    total_orders: number;
    total_customers: number;
    total_products: number;
    total_revenue: number;
  }
  
  export interface DailyStats {
    orders: number;
    revenue: number;
    new_customers: number;
  }
  
  export interface OrderStatusDistribution {
    [status: string]: number;
  }
  
  export interface SalesChartData {
    time?: string;
    day?: string;
    date?: string;
    month?: string;
    year?: string;
    sales: number;
    orders: number;
  }
  
  export interface DashboardResponse {
    success: boolean;
    data: {
      overall: OverallStats;
      today: DailyStats;
      monthly: DailyStats;
      pending_orders: any[];
      low_stock_products: any[];
      unread_messages: any[];
      order_status_distribution: OrderStatusDistribution;
    };
  }
  
  export interface SalesChartResponse {
    success: boolean;
    data: {
      chart_data: SalesChartData[];
    };
  }