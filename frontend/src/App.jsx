import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { RoleRoute } from './components/layout/RoleRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { ReviewerDashboard } from './pages/ReviewerDashboard.jsx';
import { SubmitterDashboard } from './pages/SubmitterDashboard.jsx';

/**
 * Root index redirector based on authenticated role.
 */
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div className="spinner" role="status" aria-label="Loading application"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'reviewer' ? '/review' : '/submit'} replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect to appropriate dashboard */}
          <Route path="/" element={<RootRedirect />} />

          {/* Submitter Dashboard Route */}
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRole="submitter">
                  <AppShell>
                    <SubmitterDashboard />
                  </AppShell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Reviewer Dashboard Route */}
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRole="reviewer">
                  <AppShell>
                    <ReviewerDashboard />
                  </AppShell>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <AppShell>
                <NotFoundPage />
              </AppShell>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
