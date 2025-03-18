// src/services/category-service.ts
import axios from 'axios';
import { BASE_URL } from '@/config/constants';
import { 
  CategoriesResponse, 
  CategoryDetailsResponse 
} from '@/types/category';

class CategoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BASE_URL}/categories`;
  }

  // Get all categories
  async getAllCategories(parentOnly = false): Promise<CategoriesResponse> {
    try {
      const response = await axios.get<CategoriesResponse>(`${this.baseUrl}`, {
        params: { parent_only: parentOnly }
      });
      return response.data;
    } catch (error: any) {
      console.error('Fetch Categories Error:', error);
      return {
        success: false,
        data: { categories: [] }
      };
    }
  }

  // Get category details with products
  async getCategoryDetails(
    slug: string, 
    params?: {
      page?: number;
      per_page?: number;
      sort_by?: string;
      min_price?: number;
      max_price?: number;
      brands?: string;
    }
  ): Promise<CategoryDetailsResponse> {
    try {
      const response = await axios.get<CategoryDetailsResponse>(
        `${this.baseUrl}/${slug}/products`, 
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Fetch Category Details Error:', error);
      return {
        success: false,
        data: {
          category: {} as any,
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

export default new CategoryService();