// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { GroupsProvider } from './contexts/GroupsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TaskList } from './components/tasks/TaskList';
import { TaskDetail } from './components/tasks/TaskDetail';
import { TaskCreate } from './components/tasks/TaskCreate';
import { Dashboard } from './components/dashboard/Dashboard';
import { GroupsPage } from './components/groups/GroupsPage';
import { GroupDetail } from './components/groups/GroupDetail';
import { SettingsPage } from './components/settings/SettingsPage';
import { EmailVerification } from './components/auth/EmailVerification';
import { ProfilePage } from './components/users/ProfilePage';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <GroupsProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#363636', color: '#fff' },
                success: { duration: 3000, style: { background: '#065f46' } },
                error: { duration: 4000, style: { background: '#7f1d1d' } },
              }}
            />
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/verify-email" element={<EmailVerification />} />

              {/* Защищенные маршруты с Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/tasks/create" element={<TaskCreate />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/groups" element={<GroupsPage />} />
                  <Route path="/groups/:id" element={<GroupDetail />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/users/:id" element={<ProfilePage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>
            </Routes>
          </GroupsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;