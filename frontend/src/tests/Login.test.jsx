import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { authService } from '../services/authService.js';

vi.mock('../services/authService.js', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn(() => Promise.resolve(null)),
    logout: vi.fn(),
  },
}));

describe('Frontend: Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders login form with inputs and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows inline validation errors when submitting empty form', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('displays error banner when login API rejects credentials', async () => {
    authService.login.mockRejectedValueOnce({
      status: 401,
      code: 'unauthorized',
      message: 'Invalid credentials',
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('populates fields when clicking quick login demo buttons', () => {
    renderLogin();
    const aliceBtn = screen.getByRole('button', { name: /alice \(submitter\)/i });
    fireEvent.click(aliceBtn);

    expect(screen.getByLabelText(/username/i)).toHaveValue('alice');
    expect(screen.getByLabelText(/password/i)).toHaveValue('Passw0rd!demo');
  });

  it('calls authService.login on valid submission', async () => {
    authService.login.mockResolvedValueOnce({
      token: 'mock-jwt-token',
      user: { id: 'u1', username: 'alice', name: 'Alice Submitter', role: 'submitter' },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Passw0rd!demo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'alice',
        password: 'Passw0rd!demo',
      });
    });
  });
});
