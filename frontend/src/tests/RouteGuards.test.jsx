import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';
import { RoleRoute } from '../components/layout/RoleRoute.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

describe('Frontend: Route Guards & Role-based Redirection', () => {
  it('redirects unauthenticated user to /login', () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          isLoading: false,
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/submit']}>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route
              path="/submit"
              element={
                <ProtectedRoute>
                  <div>Submitter Protected View</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Submitter Protected View')).not.toBeInTheDocument();
  });

  it('redirects submitter user away from /review to /submit', () => {
    const submitterUser = {
      id: 'sub-1',
      username: 'alice',
      name: 'Alice',
      role: 'submitter',
    };

    render(
      <AuthContext.Provider
        value={{
          user: submitterUser,
          isAuthenticated: true,
          isLoading: false,
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/review']}>
          <Routes>
            <Route path="/submit" element={<div>Submitter Dashboard Mock</div>} />
            <Route
              path="/review"
              element={
                <RoleRoute allowedRole="reviewer">
                  <div>Reviewer Only View</div>
                </RoleRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Submitter Dashboard Mock')).toBeInTheDocument();
    expect(screen.queryByText('Reviewer Only View')).not.toBeInTheDocument();
  });

  it('redirects reviewer user away from /submit to /review', () => {
    const reviewerUser = {
      id: 'rev-1',
      username: 'riley',
      name: 'Riley',
      role: 'reviewer',
    };

    render(
      <AuthContext.Provider
        value={{
          user: reviewerUser,
          isAuthenticated: true,
          isLoading: false,
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/submit']}>
          <Routes>
            <Route path="/review" element={<div>Reviewer Dashboard Mock</div>} />
            <Route
              path="/submit"
              element={
                <RoleRoute allowedRole="submitter">
                  <div>Submitter Only View</div>
                </RoleRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Reviewer Dashboard Mock')).toBeInTheDocument();
    expect(screen.queryByText('Submitter Only View')).not.toBeInTheDocument();
  });
});
