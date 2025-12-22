const createCoursesApi = (apiClient) => {
  const listCourses = async ({ page = 1, pageSize = 12, status, search, tag } = {}) => {
    const params = new URLSearchParams({ page, pageSize });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (tag) params.set('tag', tag);
    const query = params.toString();
    const path = `/admin/courses${query ? `?${query}` : ''}`;
    const response = await apiClient.get(path);
    return response.data;
  };

  const getCourse = async (id) => {
    const response = await apiClient.get(`/admin/courses/${id}`);
    return response.data;
  };

  const createCourse = async (payload) => {
    const response = await apiClient.post('/admin/courses', payload);
    return response.data;
  };

  const updateCourse = async (id, payload) => {
    const response = await apiClient.put(`/admin/courses/${id}`, payload);
    return response.data;
  };

  const patchCourse = async (id, payload) => {
    const response = await apiClient.patch(`/admin/courses/${id}`, payload);
    return response.data;
  };

  const deleteCourse = async (id) => apiClient.delete(`/admin/courses/${id}`);

  const publishCourse = async (id) => {
    const response = await apiClient.post(`/admin/courses/${id}/publish`);
    return response.data;
  };

  const archiveCourse = async (id) => {
    const response = await apiClient.post(`/admin/courses/${id}/archive`);
    return response.data;
  };

  const createModule = async (courseId, payload) => {
    const response = await apiClient.post(`/admin/courses/${courseId}/modules`, payload);
    return response.data;
  };

  const updateModule = async (moduleId, payload) => {
    const response = await apiClient.put(`/admin/modules/${moduleId}`, payload);
    return response.data;
  };

  const deleteModule = async (moduleId) => apiClient.delete(`/admin/modules/${moduleId}`);

  const reorderModule = async (moduleId, order) => {
    const response = await apiClient.patch(`/admin/modules/${moduleId}/reorder`, { order });
    return response.data;
  };

  const createLesson = async (moduleId, payload) => {
    const response = await apiClient.post(`/admin/modules/${moduleId}/lessons`, payload);
    return response.data;
  };

  const updateLesson = async (lessonId, payload) => {
    const response = await apiClient.put(`/admin/lessons/${lessonId}`, payload);
    return response.data;
  };

  const deleteLesson = async (lessonId) => apiClient.delete(`/admin/lessons/${lessonId}`);

  const reorderLesson = async (lessonId, order) => {
    const response = await apiClient.patch(`/admin/lessons/${lessonId}/reorder`, { order });
    return response.data;
  };

  return {
    listCourses,
    getCourse,
    createCourse,
    updateCourse,
    patchCourse,
    deleteCourse,
    publishCourse,
    archiveCourse,
    createModule,
    updateModule,
    deleteModule,
    reorderModule,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLesson,
  };
};

export { createCoursesApi };
