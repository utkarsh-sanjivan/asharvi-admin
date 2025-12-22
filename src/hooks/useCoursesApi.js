import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { createCoursesApi } from '../api/courses';

const useCoursesApi = () => {
  const { apiClient } = useAuth();

  const client = useMemo(() => createCoursesApi(apiClient), [apiClient]);
  return client;
};

export default useCoursesApi;
