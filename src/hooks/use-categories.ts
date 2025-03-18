// src/hooks/use-categories.ts
import { useState, useEffect } from 'react';
import CategoryService from '@/services/category-service';
import { Category, CategoriesResponse } from '@/types/category';

export function useCategories(parentOnly = false) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await CategoryService.getAllCategories(parentOnly);
        if (response.success) {
          setCategories(response.data.categories);
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

    fetchCategories();
  }, [parentOnly]);

  return { categories, isLoading, error };
}
