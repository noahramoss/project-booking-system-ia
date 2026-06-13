# 🏨 BookingSys — Plataforma de Reservas Hoteleras con IA

Aplicación **fullstack** de reservas hoteleras con un **asistente virtual de IA** como protagonista. Combina una API REST segura (Node + Express + PostgreSQL), un cliente web en React, un microservicio de Inteligencia Artificial (Python + LangGraph + RAG) y automatización de procesos con N8N.

El usuario puede buscar hoteles, gestionar sus reservas y **conversar con un agente de IA** que responde dudas sobre políticas del hotel (citando sus fuentes), consulta disponibilidad real y revisa sus reservas — todo en lenguaje natural.

## El Equipo

Soy **Noah Ramos González**, Ingeniero Informático y estudiante del Bootcamp de Desarrollo Web Full-Stack. Este proyecto es la **evolución final** del sistema de reservas del módulo de Backend, transformado en una aplicación fullstack moderna con IA integrada, automatización y despliegue en la nube.

## 🚀 Despliegue en Producción

| Servicio | URL |
| --- | --- |
| **Frontend** (Netlify) | https://booking-system-ia.netlify.app |
| **Backend API** (Render) | https://project-booking-system-ia.onrender.com |
| **Documentación Swagger** | https://project-booking-system-ia.onrender.com/api/docs |
| **Microservicio IA** (Render) | https://ia-stx4.onrender.com |

> _Nota: backend e IA están en el plan gratuito de Render, que duerme los servicios tras inactividad. La primera petición tras un rato puede tardar ~60s en "despertar" el servicio._

## ✨ Características principales

- 🔐 **Autenticación JWT** y control de acceso por roles (USER, MANAGER, ADMIN).
- 🏨 **CRUD completo** de Hoteles, Habitaciones y Reservas con reglas de negocio (anti-overbooking, cálculo de precios, soft delete).
- 🤖 **Asistente de IA** (agente LangGraph) con 3 herramientas: disponibilidad, mis reservas y consulta de políticas (RAG).
- 📚 **RAG** sobre 5 documentos de políticas del hotel, **citando la fuente** en cada respuesta.
- 🧠 **Memoria conversacional** que persiste entre turnos + historial de chat recuperable.
- ⚙️ **Automatización N8N**: emails transaccionales (bienvenida al registrarse, confirmación al reservar) con lógica condicional.
- 🎨 **Frontend React** responsive (mobile-first), con modo oscuro, rutas protegidas por rol y dashboards de Admin/Manager.
- 📖 **Documentación** con Swagger, colección Postman y este README.

## 🏗️ Arquitectura

```
┌───────────────────────────────────────────────────────────┐
│                FRONTEND — React (Netlify)                 │
│   Auth Context · React Router · ChatWidget · Dashboards   │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTPS (JWT)
┌─────────────────────────────▼─────────────────────────────┐
│             BACKEND — Node + Express (Render)             │
│  /auth /user /hotel /room /booking   +   /chat (gateway)  │
│  Helmet · Rate-limit · CORS · Zod · JWT · Error handler   │
└───────┬─────────────────────┬─────────────────────┬───────┘
        │ Prisma              │ proxy /chat         │ webhook
┌───────▼───────┐   ┌─────────▼─────────┐   ┌───────▼───────┐
│               │   │ MICROSERVICIO IA  │   │      N8N      │
│  PostgreSQL   │   │ Python · FastAPI  │   │Switch + Email │
│  (Supabase)   │   │  LangGraph Agent  │   │  (Mailtrap)   │
│               │   │  Tools → backend  │   │               │
│               │   │  RAG → ChromaDB   │   │               │
└───────────────┘   └───────────────────┘   └───────────────┘
```

El backend actúa como **gateway seguro**: el frontend nunca habla directamente con la IA. Cuando el cliente envía `POST /api/chat`, el backend valida la sesión y reenvía la petición (con el token) al microservicio de Python. El agente, a su vez, usa el propio backend como herramienta para consultar disponibilidad y reservas en tiempo real.

## 🛠️ Tecnologías utilizadas

| Capa | Tecnologías |
| --- | --- |
| **Backend** | Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcryptjs, Zod, Helmet, express-rate-limit, Morgan |
| **Frontend** | React 19, Vite, React Router v7, Context API, CSS Modules, react-markdown |
| **Inteligencia Artificial** | Python, FastAPI, LangChain, **LangGraph**, **Groq** (Llama gpt-oss-120b / qwen3-32b), **ChromaDB**, fastembed (embeddings ONNX) |
| **Automatización** | **N8N** (webhooks + nodo Switch + email SMTP) |
| **Documentación / Testing** | Swagger (OpenAPI), Postman, Vitest, Supertest |
| **Despliegue** | Render (backend + IA), Netlify (frontend), Supabase (PostgreSQL), n8n Cloud |

## 🤖 Inteligencia Artificial

El corazón del proyecto es un **agente conversacional** construido con **LangGraph** que orquesta un grafo de decisión (nodo `agent` ↔ nodo `action`/tools) con memoria persistente (`MemorySaver`).

- **Modelo:** `openai/gpt-oss-120b` como primario y `qwen/qwen3-32b` como fallback, ambos servidos gratuitamente por **Groq** con la misma API key. Hay un `recursion_limit` que evita que el agente se quede en bucle.
- **Herramientas (tools):**
  1. `check_availability_tool` — consulta hoteles/disponibilidad llamando al backend.
  2. `get_my_bookings_tool` — lee las reservas del usuario autenticado (usando su JWT).
  3. `consult_policies_tool` — **RAG** sobre los documentos de políticas.
- **RAG:** los 5 documentos de `src/docs/` (cancelaciones, mascotas, check-in/out, restaurante, spa/gimnasio) se indexan en **ChromaDB** con embeddings `all-MiniLM-L6-v2` vía **fastembed** (ONNX, sin PyTorch, para caber en hosting gratuito). Cada respuesta **cita la fuente real** del documento (`[Fuente: Política de Mascotas]`).
- **Memoria:** la conversación persiste entre turnos por `session_id`, y es recuperable vía `GET /api/chat/history/{id}`.

### Endpoints de IA — `/api/chat`

| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/chat` | Enviar un mensaje al asistente | Opcional |
| `GET` | `/api/chat/history/:sessionId` | Recuperar el historial de una sesión | No |

## ⚙️ Automatización N8N

Un workflow en **n8n Cloud** escucha un webhook al que el backend envía eventos (_fire-and-forget_, sin bloquear la petición del usuario):

- Un nodo **Switch** (lógica condicional) enruta según el tipo de evento:
  - `USER_REGISTERED` → email de **bienvenida**.
  - `BOOKING_CREATED` → email de **confirmación de reserva** (con hotel, fechas y precio).
- Los emails se envían por SMTP (Mailtrap en pruebas).
- El workflow está exportado como JSON en [`n8n-workflows/`](./n8n-workflows/).

## 📦 Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/noahramoss/project-booking-system-ia.git
cd project-booking-system-ia
```

### 2. Instalar dependencias

```bash
npm install                      # backend
npm install --prefix frontend    # frontend
```

```bash
# Microservicio de IA (Python)
cd ai_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env                  # backend (raíz)
cp frontend/.env.example frontend/.env
cp ai_service/.env.example ai_service/.env
```

Edita cada `.env` con tus credenciales (ver [Variables de entorno](#-variables-de-entorno)).

### 4. Base de datos: migraciones y datos de prueba

```bash
npx prisma migrate deploy   # crea las tablas
npx prisma db seed          # datos de ejemplo
```

### 5. Arrancar todo

```bash
npm run dev    # backend (3000) + frontend (5173) + IA (8000) a la vez
```

> El script usa `concurrently`. El frontend estará en `http://localhost:5173`.

#### Usuarios de prueba (seed)

| Rol | Email | Contraseña |
| --- | --- | --- |
| ADMIN | admin@bookingsystem.com | Admin123! |
| MANAGER | carlos@bookingsystem.com | Manager123! |
| MANAGER | maria@bookingsystem.com | Manager123! |
| USER | juan@email.com | User123! |
| USER | ana@email.com | User123! |

## 🔑 Variables de entorno

**Backend (`.env`)**

```env
PORT=3000
DATABASE_URL="postgresql://usuario:contraseña@host:5432/db"
JWT_SECRET="tu_secreto_jwt"
N8N_WEBHOOK_URL="https://TU-SUBDOMINIO.app.n8n.cloud/webhook/booking-system-events"
AI_SERVICE_URL="http://localhost:8000"      # URL del microservicio de IA
FRONTEND_URL="http://localhost:5173"         # origen permitido por CORS
```

**Frontend (`frontend/.env`)**

```env
VITE_API_URL="http://localhost:3000/api"
```

**IA (`ai_service/.env`)**

```env
GROQ_API_KEY="tu_clave_de_groq"
NODE_API_URL="http://localhost:3000/api"     # backend al que llaman las tools
```

## 📚 Documentación de la API

- **Swagger / OpenAPI** interactivo: [`/api/docs`](https://project-booking-system-ia.onrender.com/api/docs) — incluye un botón _Authorize_ para probar endpoints protegidos con tu JWT.
- **Postman:** colección en [`postman/`](./postman/).

## 🗄️ Modelo de datos

```mermaid
erDiagram
    User ||--o{ Hotel : "gestiona (MANAGER)"
    User ||--o{ Booking : "realiza"
    Hotel ||--o{ Room : "tiene"
    Room ||--o{ Booking : "se reserva"

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        String phone
        Role role
    }
    Hotel {
        String id PK
        String name UK
        String description
        String[] imageUrls
        String city
        String country
        Int stars
        Boolean isActive
        String managerId FK
    }
    Room {
        String id PK
        Int number
        RoomType type
        Int capacity
        Decimal price
        String[] amenities
        Boolean isActive
        String hotelId FK
    }
    Booking {
        String id PK
        String userId FK
        String roomId FK
        DateTime checkIn
        DateTime checkOut
        BookingStatus status
        Decimal totalPrice
    }
```

## 👥 Roles y permisos

| Acción | USER | MANAGER | ADMIN |
| --- | --- | --- | --- |
| Registrarse / Login | ✅ | ✅ | ✅ |
| Ver / editar su perfil | ✅ | ✅ | ✅ |
| Ver lista de usuarios | ❌ | ✅ (de sus hoteles) | ✅ (todos) |
| Cambiar rol / eliminar usuario | ❌ | ❌ | ✅ |
| Crear/editar/eliminar hoteles | ❌ | ✅ (los suyos) | ✅ |
| Crear/editar/eliminar habitaciones | ❌ | ✅ (de sus hoteles) | ✅ |
| Crear reservas | ✅ | ✅ | ✅ |
| Ver reservas | ✅ (las suyas) | ✅ (de sus hoteles) | ✅ (todas) |
| Cancelar reservas | ✅ (las suyas) | ✅ (de sus hoteles) | ✅ |
| Usar el asistente de IA | ✅ | ✅ | ✅ |

## 🔌 Endpoints de la API

### Autenticación — `/api/auth`
| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Registrar usuario | No |
| `POST` | `/api/auth/login` | Iniciar sesión (devuelve JWT) | No |

### Usuarios — `/api/user`
| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `GET` `PATCH` `DELETE` | `/api/user/me` | Mi perfil | Token |
| `GET` | `/api/user` · `/api/user/:id` | Listar / ver usuario | MANAGER / ADMIN |
| `PATCH` | `/api/user/:id/role` | Cambiar rol | ADMIN |
| `DELETE` | `/api/user/:id` | Eliminar usuario | ADMIN |

### Hoteles `/api/hotel` · Habitaciones `/api/room`
CRUD completo. `GET` públicos (con filtros); crear/editar/eliminar para MANAGER/ADMIN.

### Reservas — `/api/booking`
CRUD con control por rol. `DELETE` solo ADMIN.

### IA — `/api/chat`
`POST /api/chat` y `GET /api/chat/history/:sessionId` (ver sección [Inteligencia Artificial](#-inteligencia-artificial)).

> La referencia completa con cuerpos de petición y respuestas está en **Swagger** (`/api/docs`).

## 📐 Reglas de negocio

- **Anti-overbooking:** no se permiten reservas que solapen con otra activa de la misma habitación (`nuevoCheckIn < viejoCheckOut AND nuevoCheckOut > viejoCheckIn`).
- **Cálculo de precio:** `nº de noches × precio/noche`, automático.
- **Cancelación:** solo el dueño (o MANAGER/ADMIN) puede cancelar; una reserva cancelada no se modifica.
- **Soft delete:** hoteles y habitaciones se desactivan (`isActive`) en lugar de borrarse.
- **Cascade:** al eliminar un usuario se limpian sus hoteles, habitaciones y reservas.
- **Protección de admin:** un administrador no puede eliminarse ni cambiar su propio rol.

## 🧩 Retos técnicos y soluciones

1. **El agente entraba en bucle infinito.** El modelo de fallback débil reemitía llamadas a herramientas sin terminar, colgando las peticiones (500). _Solución:_ cambiar a modelos capaces (`gpt-oss-120b` + `qwen3-32b`) y añadir un `recursion_limit` con fallback resiliente.
2. **Embeddings demasiado pesados para hosting gratuito.** `sentence-transformers` arrastra PyTorch (cientos de MB) y reventaba la RAM del plan free. _Solución:_ migrar a **fastembed** (mismo modelo vía ONNX, ~100 MB).
3. **Citas de RAG poco fiables.** La IA debía citar fuentes pero no tenía los metadatos. _Solución:_ devolver el nombre real del documento por fragmento (`[Fuente: ...]`).
4. **URLs acopladas al desplegar.** El proxy a la IA y las tools apuntaban a `localhost`. _Solución:_ parametrizar todas las URLs por variables de entorno (`AI_SERVICE_URL`, `NODE_API_URL`, `VITE_API_URL`, `FRONTEND_URL`).
5. **Overbooking y borrado en cascada** (heredados del backend original): resueltos con lógica de solapamiento de fechas y `onDelete: Cascade` en Prisma.

## 🧪 Tests

```bash
npm test    # tests de integración y de servicios con Vitest + Supertest
```

## 🖥️ Frontend

Cliente web en **React 19 + Vite** que consume la API e integra el chat de IA. Documentación detallada en [`frontend/README.md`](./frontend/README.md).
