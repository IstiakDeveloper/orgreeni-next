export interface Brand {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    is_active: boolean;
    order?: number;
    meta_title?: string;
    meta_description?: string;
  }
  
  export interface BrandProduct {
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
    category: {
      id: number;
      name: string;
      slug: string;
    };
  }
  
  export interface BrandsResponse {
    success: boolean;
    data: {
      brands: Brand[];
    };
  }
  
  export interface BrandDetailsResponse {
    success: boolean;
    data: {
      brand: Brand;
      products: {
        data: BrandProduct[];
        current_page: number;
        last_page: number;
        total: number;
      };
    };
  }