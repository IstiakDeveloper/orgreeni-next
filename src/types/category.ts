// src/types/category.ts
export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    is_active: boolean;
    order?: number;
    meta_title?: string;
    meta_description?: string;
    children?: Category[];
  }
  
  export interface CategoryProduct {
    id: number;
    name: string;
    slug: string;
    sale_price: number;
    regular_price: number;
    images: Array<{
      id: number;
      url: string;
      is_primary: boolean;
    }>;
    brand: {
      id: number;
      name: string;
      slug: string;
    };
  }
  
  export interface CategoriesResponse {
    success: boolean;
    data: {
      categories: Category[];
    };
  }
  
  export interface CategoryDetailsResponse {
    success: boolean;
    data: {
      category: Category;
      products: {
        data: CategoryProduct[];
        current_page: number;
        last_page: number;
        total: number;
      };
    };
  }