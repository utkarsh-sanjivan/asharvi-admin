import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Grid, IconButton, Pagination, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Page.module.css';
import CourseCard from '../components/courses/CourseCard';
import CourseFilters from '../components/courses/CourseFilters';
import CourseSkeletonGrid from '../components/courses/CourseSkeletonGrid';
import EmptyState from '../components/courses/EmptyState';
import CourseDrawer from '../components/courses/CourseDrawer';
import useCoursesApi from '../hooks/useCoursesApi';

const CoursesPage = ({ environment }) => {
  const api = useCoursesApi();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, pageSize: 12, search: '', status: undefined, tag: undefined });
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listCourses(filters);
      setCourses(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [filters, environment]);

  const handleCardClick = (course) => {
    setSelected(course);
    setDrawerOpen(true);
  };

  const handleCreate = async () => {
    try {
      const payload = { title: 'Untitled course', status: 'draft', visibility: 'unlisted' };
      const created = await api.createCourse(payload);
      navigate(`/courses/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create course');
    }
  };

  const pageCount = useMemo(() => Math.ceil((total || 0) / (filters.pageSize || 12)), [total, filters.pageSize]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Courses</h1>
          <p className={styles.subtitle}>Manage catalog, pricing, and availability.</p>
        </div>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadCourses}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            New Course
          </Button>
        </Stack>
      </div>

      <Stack spacing={2} sx={{ marginBottom: 2 }}>
        <CourseFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({ page: 1, pageSize: 12, search: '', status: undefined, tag: undefined })}
          onToggleDrawer={() => {
            if (courses.length > 0) {
              setSelected(courses[0]);
              setDrawerOpen(true);
            }
          }}
        />
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      {isLoading ? (
        <CourseSkeletonGrid />
      ) : courses.length === 0 ? (
        <EmptyState onCreate={handleCreate} />
      ) : (
        <>
          <Grid container spacing={2}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <CourseCard course={course} onClick={() => handleCardClick(course)} />
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" justifyContent="flex-end" sx={{ marginTop: 2 }}>
            <Pagination
              page={filters.page}
              count={pageCount || 1}
              onChange={(_, page) => setFilters({ ...filters, page })}
              shape="rounded"
            />
          </Stack>
        </>
      )}

      <CourseDrawer
        open={drawerOpen}
        course={selected}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => selected && navigate(`/courses/${selected.id}`)}
        onPublish={async () => {
          if (!selected) return;
          const confirmed = window.confirm(
            environment === 'production'
              ? 'Publish in production? Students will see this immediately.'
              : 'Publish this course?'
          );
          if (!confirmed) return;
          try {
            await api.publishCourse(selected.id);
            loadCourses();
          } catch (err) {
            setError(err.message || 'Publish failed');
          }
        }}
        onArchive={async () => {
          if (!selected) return;
          const confirmed = window.confirm(
            environment === 'production'
              ? 'Archive in production? Active students will lose access.'
              : 'Archive this course?'
          );
          if (!confirmed) return;
          try {
            await api.archiveCourse(selected.id);
            loadCourses();
          } catch (err) {
            setError(err.message || 'Archive failed');
          }
        }}
        onDelete={async () => {
          if (!selected) return;
          const confirmed = window.confirm(
            environment === 'production'
              ? 'Delete in production is irreversible. Continue?'
              : 'Delete this course?'
          );
          if (!confirmed) return;
          try {
            await api.deleteCourse(selected.id);
            setDrawerOpen(false);
            loadCourses();
          } catch (err) {
            if (err.status === 409) {
              setError('Cannot delete published course. Please archive instead.');
            } else {
              setError(err.message || 'Delete failed');
            }
          }
        }}
      />
    </div>
  );
};

export default CoursesPage;
