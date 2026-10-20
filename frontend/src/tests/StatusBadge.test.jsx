import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../components/ui/Badge.jsx';

describe('Frontend: StatusBadge Component', () => {
  it('renders pending status badge with amber style and label', () => {
    render(<Badge status="pending" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-pending');
    expect(badge).toHaveTextContent('pending');
  });

  it('renders approved status badge with emerald style and label', () => {
    render(<Badge status="approved" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-approved');
    expect(badge).toHaveTextContent('approved');
  });

  it('renders rejected status badge with rose style and label', () => {
    render(<Badge status="rejected" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-rejected');
    expect(badge).toHaveTextContent('rejected');
  });

  it('renders custom label when provided', () => {
    render(<Badge status="pending" label="Awaiting Review" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Awaiting Review');
  });
});
