const defaultCourse = () => ({
  slug: '',
  title: '',
  description: '',
  status: 'draft',
  category: '',
  priceCents: 0,
  currency: 'USD',
  thumbnailUrl: '',
  durationMinutes: 0,
  tags: [],
  instructors: [],
  seo: { metaTitle: '', metaDescription: '' },
  visibility: 'unlisted',
  publishedAt: null,
  deletedAt: null,
  modules: [],
});

const normalizeCourse = (course) => ({
  ...defaultCourse(),
  ...course,
  seo: { ...defaultCourse().seo, ...(course?.seo || {}) },
  modules: (course?.modules || []).map((m) => ({
    lessons: [],
    ...m,
    lessons: (m.lessons || []).map((l) => ({
      attachments: [],
      ...l,
      attachments: l.attachments || [],
    })),
  })),
});

const slugIsValid = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '');

const applyReplication = (sourceCourse) => {
  const cloned = normalizeCourse(sourceCourse);
  const randomId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const modules = (cloned.modules || []).map((mod, index) => ({
    ...mod,
    id: randomId(),
    order: index + 1,
    lessons: (mod.lessons || []).map((lesson, lIndex) => ({
      ...lesson,
      id: randomId(),
      order: lIndex + 1,
      quiz: lesson.quiz ? { ...lesson.quiz } : undefined,
    })),
  }));

  return {
    ...cloned,
    id: undefined,
    slug: `${cloned.slug || 'course'}-${Math.floor(Math.random() * 1000)}`,
    status: 'draft',
    publishedAt: null,
    deletedAt: null,
    createdAt: null,
    updatedAt: null,
    modules,
  };
};

export { applyReplication, defaultCourse, normalizeCourse, slugIsValid };
