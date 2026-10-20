import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Main application layout shell with top navigation bar and user credentials.
 */
export const AppShell = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="topbar" role="banner">
        <div className="topbar-brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>DocFlow</span>
        </div>

        {user && (
          <nav className="topbar-nav" aria-label="User navigation">
            <div className="topbar-user">
              <div className="user-badge" id="current-user-badge">
                <span className="user-avatar" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="username" style={{ fontWeight: 500 }}>
                  {user.name}
                </span>
                <span className={`badge badge-${user.role}`}>{user.role}</span>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                id="logout-button"
                onClick={logout}
                aria-label="Log out of application"
              >
                Log Out
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="main-content" id="main-content" role="main">
        {children}
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>Document Approval Workflow &bull; Evaluation Take-Home Project</p>
      </footer>
    </div>
  );
};

export default AppShell;
