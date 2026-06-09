import React from 'react';
import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Loader Component', () => {
  it('renders correctly without crashing', () => {
    const { container } = render(<Loader />);
    
    // Verificamos que contenga un div con la clase spinner
    const spinner = container.querySelector('div[class*="spinner"]');
    expect(spinner).toBeInTheDocument();
  });
});
