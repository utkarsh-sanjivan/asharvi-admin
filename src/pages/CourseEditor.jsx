import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { unstable_useBlocker as useBlocker, useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import styles from '../styles/Page.module.css';
import useCoursesApi from '../hooks/useCoursesApi';
import { applyReplication, normalizeCourse, slugIsValid } from '../utils/courses';
import { deepEqual } from '../utils/form';
import { createApiClient } from '../api/apiClientFactory';
import { getApiBaseUrl, ENVIRONMENTS } from '../config/environment';
import { getAuthConfig } from '../config/auth';
import { getCookie } from '../utils/cookies';
import { createCoursesApi } from '../api/courses';

const TabPanel = ({ value, index, children }) => {
  if (value !== index) return null;
  return <Box sx={{ paddingTop: 2 }}>{children}</Box>;
};

const BasicsTab = ({ course, onChange, slugError }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Title"
          fullWidth
          value={course.title || ''}
          onChange={(e) => onChange({ ...course, title: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Slug"
          fullWidth
          value={course.slug || ''}
          error={!!slugError}
          helperText={slugError || 'Use lowercase letters, numbers, and hyphens'}
          onChange={(e) => onChange({ ...course, slug: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={3}
          value={course.description || ''}
          onChange={(e) => onChange({ ...course, description: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Category"
          fullWidth
          value={course.category || ''}
          onChange={(e) => onChange({ ...course, category: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Thumbnail URL"
          fullWidth
          value={course.thumbnailUrl || ''}
          onChange={(e) => onChange({ ...course, thumbnailUrl: e.target.value })}
          helperText="Upload coming soon"
        />
      </Grid>
    </Grid>
  );
};

const PricingTab = ({ course, onChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        label="Price (cents)"
        type="number"
        fullWidth
        value={course.priceCents || 0}
        onChange={(e) => onChange({ ...course, priceCents: Number(e.target.value) })}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <FormControl fullWidth>
        <InputLabel id="currency-label">Currency</InputLabel>
        <Select
          labelId="currency-label"
          label="Currency"
          value={course.currency || 'USD'}
          onChange={(e) => onChange({ ...course, currency: e.target.value })}
        >
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="EUR">EUR</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  </Grid>
);

const SeoTab = ({ course, onChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <TextField
        label="Meta title"
        fullWidth
        value={course.seo?.metaTitle || ''}
        onChange={(e) => onChange({ ...course, seo: { ...course.seo, metaTitle: e.target.value } })}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        label="Meta description"
        fullWidth
        multiline
        minRows={2}
        value={course.seo?.metaDescription || ''}
        onChange={(e) => onChange({ ...course, seo: { ...course.seo, metaDescription: e.target.value } })}
      />
    </Grid>
  </Grid>
);

const PublishingTab = ({ course }) => (
  <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">
      Status: <strong>{course.status}</strong>
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Visibility: {course.visibility || 'unlisted'}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Published at: {course.publishedAt || 'not published'}
    </Typography>
  </Stack>
);

const LessonRow = ({ lesson, onChange, onDelete, onMove }) => (
  <Stack spacing={1} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, padding: 1.5 }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="subtitle2">{lesson.title || 'Lesson'}</Typography>
      <Chip label={lesson.type} size="small" />
      <Box sx={{ flex: 1 }} />
      <Button size="small" onClick={() => onMove(-1)}>
        Up
      </Button>
      <Button size="small" onClick={() => onMove(1)}>
        Down
      </Button>
      <Button size="small" color="error" onClick={onDelete}>
        Delete
      </Button>
    </Stack>
    <TextField
      label="Lesson title"
      fullWidth
      value={lesson.title || ''}
      onChange={(e) => onChange({ ...lesson, title: e.target.value })}
    />
    <FormControl fullWidth>
      <InputLabel id={`type-${lesson.id}`}>Type</InputLabel>
      <Select
        labelId={`type-${lesson.id}`}
        label="Type"
        value={lesson.type || 'video'}
        onChange={(e) => onChange({ ...lesson, type: e.target.value })}
      >
        <MenuItem value="video">Video</MenuItem>
        <MenuItem value="article">Article</MenuItem>
        <MenuItem value="quiz">Quiz</MenuItem>
        <MenuItem value="download">Download</MenuItem>
      </Select>
    </FormControl>
    <TextField
      label="Content / URL"
      fullWidth
      value={lesson.content || ''}
      onChange={(e) => onChange({ ...lesson, content: e.target.value })}
    />
  </Stack>
);

const ModuleCard = ({ module, onChange, onDelete, onAddLesson, onMoveModule, onMoveLesson }) => (
  <Stack spacing={1.5} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, padding: 2, background: '#f8fafc' }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="h6">{module.title || 'Module'}</Typography>
      <Box sx={{ flex: 1 }} />
      <Button size="small" onClick={() => onMoveModule(-1)}>
        Up
      </Button>
      <Button size="small" onClick={() => onMoveModule(1)}>
        Down
      </Button>
      <Button size="small" color="error" onClick={onDelete}>
        Remove
      </Button>
    </Stack>
    <TextField
      label="Module title"
      fullWidth
      value={module.title || ''}
      onChange={(e) => onChange({ ...module, title: e.target.value })}
    />
    <TextField
      label="Summary"
      fullWidth
      multiline
      minRows={2}
      value={module.summary || ''}
      onChange={(e) => onChange({ ...module, summary: e.target.value })}
    />
    <Divider />
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2">Lessons</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={onAddLesson}>
          Add lesson
        </Button>
      </Stack>
      <Stack spacing={1}>
        {module.lessons?.map((lesson, idx) => (
          <LessonRow
            key={lesson.id || idx}
            lesson={lesson}
            onChange={(updated) => onChange({ ...module, lessons: module.lessons.map((l, i) => (i === idx ? updated : l)) })}
            onDelete={() => onChange({ ...module, lessons: module.lessons.filter((_, i) => i !== idx) })}
            onMove={(delta) => onMoveLesson(idx, delta)}
          />
        ))}
      </Stack>
    </Stack>
  </Stack>
);

const CurriculumTab = ({ course, onChange }) => {
  const modules = course.modules || [];

  const addModule = () => {
    const next = [...modules, { id: `m-${Date.now()}`, title: 'New module', lessons: [], order: modules.length + 1 }];
    onChange({ ...course, modules: next });
  };

  const updateModule = (index, mod) => {
    const next = modules.map((m, i) => (i === index ? { ...mod } : m));
    onChange({ ...course, modules: next });
  };

  const removeModule = (index) => {
    const next = modules.filter((_, i) => i !== index);
    onChange({ ...course, modules: next });
  };

  const moveModule = (index, delta) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= modules.length) return;
    const reordered = [...modules];
    const [item] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, item);
    onChange({ ...course, modules: reordered });
  };

  const moveLesson = (moduleIndex, lessonIndex, delta) => {
    const mod = modules[moduleIndex];
    const newIndex = lessonIndex + delta;
    if (newIndex < 0 || newIndex >= mod.lessons.length) return;
    const lessons = [...mod.lessons];
    const [item] = lessons.splice(lessonIndex, 1);
    lessons.splice(newIndex, 0, item);
    updateModule(moduleIndex, { ...mod, lessons });
  };

  return (
    <Stack spacing={2}>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={addModule}>
        Add module
      </Button>
      <Stack spacing={2}>
        {modules.map((mod, idx) => (
          <ModuleCard
            key={mod.id || idx}
            module={mod}
            onChange={(m) => updateModule(idx, m)}
            onDelete={() => removeModule(idx)}
            onAddLesson={() =>
              updateModule(idx, {
                ...mod,
                lessons: [
                  ...(mod.lessons || []),
                  { id: `l-${Date.now()}`, title: 'New lesson', type: 'video', order: (mod.lessons?.length || 0) + 1 },
                ],
              })
            }
            onMoveModule={(delta) => moveModule(idx, delta)}
            onMoveLesson={(lessonIndex, delta) => moveLesson(idx, lessonIndex, delta)}
          />
        ))}
      </Stack>
    </Stack>
  );
};

const ReplicateDialog = ({ open, onClose, onSelect, isLoading, courses, sourceEnv, onEnvChange, onSearch }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Replicate from environment</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="source-env">Source environment</InputLabel>
          <Select
            labelId="source-env"
            label="Source environment"
            value={sourceEnv}
            onChange={(e) => onEnvChange(e.target.value)}
          >
            <MenuItem value={ENVIRONMENTS.staging}>Staging</MenuItem>
            <MenuItem value={ENVIRONMENTS.production}>Production</MenuItem>
          </Select>
        </FormControl>
        <TextField placeholder="Search course" fullWidth onChange={(e) => onSearch(e.target.value)} />
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {courses.map((course) => (
              <ListItem button key={course.id} onClick={() => onSelect(course)}>
                <ListItemText primary={course.title || 'Untitled'} secondary={course.slug} />
              </ListItem>
            ))}
            {courses.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No courses found
              </Typography>
            )}
          </List>
        )}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

const CourseEditorPage = ({ environment }) => {
  const { courseId } = useParams();
  const api = useCoursesApi();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [initialCourse, setInitialCourse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [dirty, setDirty] = useState(false);
  const [replicateOpen, setReplicateOpen] = useState(false);
  const [replicateEnv, setReplicateEnv] = useState(ENVIRONMENTS.staging);
  const [replicateList, setReplicateList] = useState([]);
  const [isReplicateLoading, setIsReplicateLoading] = useState(false);
  const [replicateSearch, setReplicateSearch] = useState('');
  const saveTimeoutRef = useRef();

  const loadCourse = async () => {
    setError(null);
    try {
      const data = await api.getCourse(courseId);
      const normalized = normalizeCourse(data);
      setCourse(normalized);
      setInitialCourse(normalized);
      setDirty(false);
      setSaveState('idle');
    } catch (err) {
      setError(err.message || 'Failed to load course');
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId, environment]);

  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const isSlugValid = course ? slugIsValid(course.slug) : true;

  const triggerSave = async (payload) => {
    if (!dirty) return;
    if (!isSlugValid) return;
    setSaveState('saving');
    try {
      const saved = await api.updateCourse(courseId, payload || course);
      const normalized = normalizeCourse(saved);
      setCourse(normalized);
      setInitialCourse(normalized);
      setDirty(false);
      setSaveState('saved');
    } catch (err) {
      setError(err.message || 'Failed to save');
      setSaveState('error');
    }
  };

  const handleChange = (updated) => {
    setCourse(updated);
    const changed = initialCourse ? !deepEqual(initialCourse, updated) : true;
    setDirty(changed);
  };

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (dirty && isSlugValid) {
      saveTimeoutRef.current = setTimeout(() => triggerSave(), 800);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [course, dirty, isSlugValid]);

  const navigationBlocker = useBlocker(() => dirty);
  useEffect(() => {
    if (navigationBlocker.state === 'blocked') {
      const confirmed = window.confirm('You have unsaved changes. Leave this page?');
      if (confirmed) {
        navigationBlocker.proceed();
      } else {
        navigationBlocker.reset();
      }
    }
  }, [navigationBlocker]);

  if (!course) {
    return (
      <div className={styles.page}>
        <Typography variant="h6">Loading course...</Typography>
      </div>
    );
  }

  const manualSave = () => triggerSave();

  const handlePublish = async () => {
    await api.publishCourse(courseId);
    loadCourse();
  };

  const handleArchive = async () => {
    await api.archiveCourse(courseId);
    loadCourse();
  };

  const handleDelete = async () => {
    try {
      await api.deleteCourse(courseId);
      navigate('/courses');
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const fetchReplicate = async (env, search) => {
    setIsReplicateLoading(true);
    try {
      const client = createApiClient({
        baseUrl: getApiBaseUrl(env),
        getAccessToken: () => getCookie('access_token'),
        authPaths: getAuthConfig(),
        onAuthFailure: () => {},
      });
      const list = await createCoursesApi(client).listCourses({ page: 1, pageSize: 20, search });
      setReplicateList(list.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load source courses');
    } finally {
      setIsReplicateLoading(false);
    }
  };

  useEffect(() => {
    if (replicateOpen) {
      fetchReplicate(replicateEnv, replicateSearch);
    }
  }, [replicateOpen, replicateEnv, replicateSearch]);

  const handleSelectReplicate = (sourceCourse) => {
    const transformed = applyReplication(sourceCourse);
    const merged = { ...course, ...transformed, id: course.id };
    setCourse(merged);
    setDirty(true);
    setReplicateOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{course.title || 'Course editor'}</h1>
          <p className={styles.subtitle}>Edit course details and curriculum.</p>
        </div>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={dirty ? 'Unsaved changes' : 'Saved'} color={dirty ? 'warning' : 'success'} />
          <Tooltip title="Refresh course">
            <IconButton onClick={loadCourse}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button startIcon={<SaveIcon />} onClick={manualSave} variant="outlined">
            Save
          </Button>
          <Button startIcon={<PublishIcon />} onClick={handlePublish}>
            Publish
          </Button>
          <Button startIcon={<ArchiveIcon />} onClick={handleArchive}>
            Archive
          </Button>
          <Button startIcon={<DeleteIcon />} color="error" onClick={handleDelete}>
            Delete
          </Button>
        </Stack>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Save status: {saveState}
        </Typography>
        <Chip label={`Env: ${environment}`} size="small" />
        <Button size="small" variant="text" onClick={() => setReplicateOpen(true)}>
          Replicate from environment
        </Button>
      </Stack>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable">
        <Tab label="Basics" />
        <Tab label="Curriculum" />
        <Tab label="Pricing" />
        <Tab label="SEO" />
        <Tab label="Publishing" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <BasicsTab course={course} onChange={handleChange} slugError={isSlugValid ? '' : 'Invalid slug'} />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <CurriculumTab course={course} onChange={handleChange} />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <PricingTab course={course} onChange={handleChange} />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <SeoTab course={course} onChange={handleChange} />
      </TabPanel>
      <TabPanel value={activeTab} index={4}>
        <PublishingTab course={course} />
      </TabPanel>

      <ReplicateDialog
        open={replicateOpen}
        onClose={() => setReplicateOpen(false)}
        onSelect={handleSelectReplicate}
        isLoading={isReplicateLoading}
        courses={replicateList}
        sourceEnv={replicateEnv}
        onEnvChange={setReplicateEnv}
        onSearch={setReplicateSearch}
      />
    </div>
  );
};

export default CourseEditorPage;
