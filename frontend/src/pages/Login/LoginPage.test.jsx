import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from './LoginPage';
import * as AuthContext from '../../context/AuthContext';

// 1. Mockeamos el hook useNavigate de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage Component', () => {
  // Mockeamos la función login del context
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Interceptamos el hook useAuth para devolver nuestra función falsa
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ login: mockLogin });
    
    // Mockeamos la función fetch global
    global.fetch = vi.fn();
  });

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders login form correctly', () => {
    renderWithRouter(<LoginPage />);
    
    // Comprobamos que están los inputs y el botón
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('shows loading state and calls API on submit', async () => {
    // Simulamos una respuesta de API exitosa
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 1, name: 'Test' }, token: 'fake-jwt' })
    });

    renderWithRouter(<LoginPage />);

    // Rellenamos el formulario
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123!' } });

    // Hacemos submit
    const button = screen.getByRole('button', { name: /Entrar/i });
    fireEvent.click(button);

    // El botón debería cambiar a "Cargando..."
    expect(screen.getByRole('button', { name: /Cargando\.\.\./i })).toBeInTheDocument();

    // Esperamos a que la petición asíncrona termine
    await waitFor(() => {
      // Debería haber llamado a nuestro login mockeado con los datos de la API
      expect(mockLogin).toHaveBeenCalledWith({ id: 1, name: 'Test' }, 'fake-jwt');
      // Debería habernos redirigido a la home
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message if login fails', async () => {
    // Simulamos un error de credenciales
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Credenciales inválidas' })
    });

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'badpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    // Esperamos a que aparezca el mensaje de error en pantalla
    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });

    // El mock de login NUNCA debió llamarse
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
