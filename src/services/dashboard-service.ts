import axios from 'axios';
import { BASE_URL } from '@/config/constants';
import { 
  DashboardResponse, 
  SalesChartResponse 
} from '@/types/dashboard';
import AuthService from './auth-service';

class DashboardService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BASE_URL}/v1/admin/dashboard`;
  }

  async getDashboardStats(): Promise<DashboardResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.get<DashboardResponse>(
        `${this.baseUrl}/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Dashboard Stats Error:', error);
      return {
        success: false,
        data: {
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
        }
      };
    }
  }

  async getSalesChart(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'): Promise<SalesChartResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.get<SalesChartResponse>(
        `${this.baseUrl}/sales-chart`,
        {
          params: { period },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Sales Chart Error:', error);
      return {
        success: false,
        data: {
          chart_data: []
        }
      };
    }
  }
}

export default new DashboardService();