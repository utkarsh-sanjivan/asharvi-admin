import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import RequireAdmin from './RequireAdmin';
import RequireAuth from './RequireAuth';
import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/Dashboard';
import CoursesPage from '../pages/Courses';
import CourseEditorPage from '../pages/CourseEditor';
import SettingsPage from '../pages/Settings';
import LoginPage from '../pages/Login/Login';
import NotFoundPage from '../pages/NotFound/NotFound';

const App = () => {
  const { environment } = useAuth();

  return (
    <BrowserRouter basename="/asharvi-admin">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <RequireAdmin>
                <DashboardPage environment={environment} />
              </RequireAdmin>
            }
          />
          <Route
            path="courses"
            element={
              <RequireAdmin>
                <CoursesPage environment={environment} />
              </RequireAdmin>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <RequireAdmin>
                <CourseEditorPage environment={environment} />
              </RequireAdmin>
            }
          />
          <Route
            path="settings"
            element={
              <RequireAdmin>
                <SettingsPage environment={environment} />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
