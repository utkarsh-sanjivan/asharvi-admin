import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/Dashboard';
import CoursesPage from '../pages/Courses';
import SettingsPage from '../pages/Settings';
import { ENVIRONMENTS, getStoredEnvironment, setStoredEnvironment } from '../config/environment';

const App = () => {
  const [environment, setEnvironment] = useState(() => getStoredEnvironment());

  useEffect(() => {
    setStoredEnvironment(environment);
  }, [environment]);

  return (
    <BrowserRouter basename="/asharvi-admin">
      <Routes>
        <Route element={<AppLayout environment={environment} onEnvironmentChange={setEnvironment} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage environment={environment} />} />
          <Route path="courses" element={<CoursesPage environment={environment} />} />
          <Route path="settings" element={<SettingsPage environment={environment} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
