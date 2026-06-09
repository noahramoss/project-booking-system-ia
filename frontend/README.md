# 🏨 Frontend Booking System

Este directorio contiene el cliente web (frontend) para el proyecto **Booking System**. Se ha construido con **React** y **Vite** para ofrecer una experiencia de usuario rápida y dinámica ("Single Page Application").

El objetivo principal de esta interfaz es permitir probar de manera visual e interactiva la lógica de la API REST que funciona por debajo, sin necesidad de usar herramientas como Postman.

## ✨ Características Principales

- **Diseño Mobile-First**: Estilos construidos desde cero con *CSS Modules* y variables CSS nativas para que se adapte perfectamente a cualquier dispositivo.
- **Autenticación JWT Robusta**: Implementación de Context API (`AuthContext`) para mantener la sesión del usuario persistente, además de un *hook* `useApi` que inyecta automáticamente el token en cada petición al backend.
- **Role-Based Routing**: Componentes protegidos que renderizan diferentes vistas dependiendo de si el usuario logueado es `USER`, `MANAGER` o `ADMIN`.
- **Testing Frontend**: Suite de tests configurada con Vitest y React Testing Library.

## 🛠️ Tecnologías

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/) (Navegación y protección de rutas)
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🚀 Guía de Inicio

### 1. Requisitos previos
Dado que este proyecto está diseñado para funcionar de forma separada del backend, asegúrate de haber instalado las dependencias primero:
```bash
cd frontend
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz de esta carpeta (`frontend/`) y define la URL de tu backend. Por defecto, puedes usar la URL del servidor desplegado en Render:
```env
VITE_API_URL=https://project-booking-system.onrender.com/api
```
*(Si vas a correr tu backend en local, cámbialo a `http://localhost:3000/api`)*

### 3. Entorno de Desarrollo
Para arrancar la interfaz web en tu máquina local:
```bash
npm run dev
```
La aplicación se abrirá habitualmente en `http://localhost:5173`.

> **Nota importante sobre el rendimiento:** Si usas el backend en el servidor gratuito de Render, el "primer inicio de sesión" puede tardar hasta 50 segundos si el servidor estaba inactivo.

## 🧪 Ejecutar los Tests

La interfaz cuenta con pruebas automatizadas que verifican desde el renderizado de los componentes base hasta integraciones completas del formulario de Login con la API simulada (mock).

Para ejecutarlos:
```bash
npm run test
```
O si quieres dejarlos en modo vigilancia (*watch mode*) mientras programas:
```bash
npm run test:watch
```
