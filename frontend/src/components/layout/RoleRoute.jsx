import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Route guard that enforces role access.
 * Redirects submitters away from /review and reviewers away from /submit.
 */
export const RoleRoute = ({ allowedRole, children }) => {
  const { user, isLoading } = useAuth();

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
        <div className="spinner" role="status" aria-label="Loading role verification"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    // Redirect submitters to /submit, reviewers to /review
    const redirectPath = user.role === 'reviewer' ? '/review' : '/submit';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleRoute;
