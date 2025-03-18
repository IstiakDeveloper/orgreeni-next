// src/services/brand-service.ts
import axios from 'axios';
import { BASE_URL } from '@/config/constants';
import { 
  BrandsResponse, 
  BrandDetailsResponse 
} from '@/types/brand';

class BrandService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BASE_URL}/brands`;
  }

  // Get all brands
  async getAllBrands(): Promise<BrandsResponse> {
    try {
      const response = await axios.get<BrandsResponse>(`${this.baseUrl}`);
      return response.data;
    } catch (error: any) {
      console.error('Fetch Brands Error:', error);
      return {
        success: false,
        data: { brands: [] }
      };
    }
  }

  // Get brand details with products
  async getBrandDetails(
    slug: string, 
    params?: {
      page?: number;
      per_page?: number;
      sort_by?: string;
      min_price?: number;
      max_price?: number;
      category_id?: number;
    }
  ): Promise<BrandDetailsResponse> {
    try {
      const response = await axios.get<BrandDetailsResponse>(
        `${this.baseUrl}/${slug}`, 
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Fetch Brand Details Error:', error);
      return {
        success: false,
        data: {
          brand: {} as any,
          products: {
            data: [],
            current_page: 1,
            last_page: 1,
            total: 0
          }
        }
      };
    }
  }
}

export default new BrandService();