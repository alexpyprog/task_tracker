import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TaskList } from './components/tasks/TaskList';
import { TaskDetail } from './components/tasks/TaskDetail';
import { TaskCreate } from './components/tasks/TaskCreate';
import { ProfilePage } from './components/users/ProfilePage';
import './styles/global.css';

// const TaskDetail = () => <div>Task Detail Page</div>;
// const TaskCreate = () => <div>Create Task Page</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Routes>
          <Route path="/users/:id" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TaskList />
            </ProtectedRoute>
          } />
          <Route path="/tasks/create" element={
            <ProtectedRoute>
              <TaskCreate />
            </ProtectedRoute>
          } />
          <Route path="/tasks/:id" element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;