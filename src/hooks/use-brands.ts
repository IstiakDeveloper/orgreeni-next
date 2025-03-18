// src/hooks/use-categories.ts
import { useState, useEffect } from 'react';
import BrandService from '@/services/brand-service';
import { Brand, BrandsResponse } from '@/types/brand';

export function useBrands(parentOnly = false) {
  const [categories, setCategories] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const response = await BrandService.getAllBrands(parentOnly);
        if (response.success) {
          setBrands(response.data.brands);
          setError(null);
        } else {
          setError('Failed to fetch categories');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, [parentOnly]);

  return { brands, isLoading, error };
}
