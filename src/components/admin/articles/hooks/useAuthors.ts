import { useState, useEffect } from 'react';
import { UserProfilesService } from '../../../../../backend';

interface Author {
  id: string;
  full_name: string;
  role: string;
}

export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthors() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch author options (admin, editor, author roles)
        const { data, error: fetchError } = await UserProfilesService.getAuthorOptions();

        if (fetchError) {
          setError('Không thể tải danh sách tác giả');
          console.error('Error fetching authors:', fetchError);
          return;
        }

        if (data) {
          setAuthors(data);
        }
      } catch (err) {
        setError('Không thể tải danh sách tác giả');
        console.error('Error fetching authors:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthors();
  }, []);

  return { authors, loading, error };
}
