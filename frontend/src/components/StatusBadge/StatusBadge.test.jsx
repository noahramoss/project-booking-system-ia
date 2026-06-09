import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders PENDING status correctly', () => {
    render(<StatusBadge status="PENDING" />);
    const badge = screen.getByText('Pendiente');
    expect(badge).toBeInTheDocument();
    // Validamos que tenga la clase que define su color
    expect(badge.className).toMatch(/pending/);
  });

  it('renders CONFIRMED status correctly', () => {
    render(<StatusBadge status="CONFIRMED" />);
    const badge = screen.getByText('Confirmada');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/confirmed/);
  });

  it('renders CANCELLED status correctly', () => {
    render(<StatusBadge status="CANCELLED" />);
    const badge = screen.getByText('Cancelada');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/cancelled/);
  });

  it('renders fallback for unknown status', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    const badge = screen.getByText('UNKNOWN_STATUS');
    expect(badge).toBeInTheDocument();
  });
});
