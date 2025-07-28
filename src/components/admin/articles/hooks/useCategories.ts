import { useState, useEffect } from 'react';
import { loadCategoriesService, type Category } from '../../../../../backend';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);

        // Lazy load categories service
        const CategoriesService = await loadCategoriesService();

        // Fetch all active categories
        const { data, error: fetchError } = await CategoriesService.getCategories(1, 100, {
          status: 'active',
          sort_by: 'name',
          sort_order: 'asc'
        });

        if (fetchError) {
          setError('Không thể tải danh sách danh mục');
          console.error('Error fetching categories:', fetchError);
          return;
        }

        if (data?.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        setError('Không thể tải danh sách danh mục');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
