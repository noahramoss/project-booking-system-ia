// Especificación OpenAPI 3.0 del Booking System API.
// Se sirve con swagger-ui-express en /api/docs (ver app.js).

const bearer = [{ bearerAuth: [] }];

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Booking System API",
    version: "1.0.0",
    description:
      "API REST de BookingSys: gestión de hoteles, habitaciones y reservas con autenticación JWT, control por roles (USER, MANAGER, ADMIN) y un asistente de IA (RAG + tools) en /api/chat.",
  },
  servers: [
    {
      url: "https://project-booking-system-ia.onrender.com/api",
      description: "Producción (Render)",
    },
    { url: "http://localhost:3000/api", description: "Desarrollo local" },
  ],
  tags: [
    { name: "Auth", description: "Registro e inicio de sesión" },
    { name: "Users", description: "Gestión de usuarios y roles" },
    { name: "Hotels", description: "Gestión de hoteles" },
    { name: "Rooms", description: "Gestión de habitaciones" },
    { name: "Bookings", description: "Gestión de reservas" },
    { name: "Chat", description: "Asistente virtual de IA (RAG + tools)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Recurso no encontrado" },
          detalles: {
            type: "array",
            items: { type: "string" },
            example: ["email: Email inválido"],
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Juan Pérez" },
          email: { type: "string", format: "email", example: "juan@email.com" },
          role: { type: "string", enum: ["USER", "MANAGER", "ADMIN"] },
        },
      },
      Hotel: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Hotel Sierra Nevada" },
          description: { type: "string" },
          city: { type: "string", example: "Granada" },
          country: { type: "string", example: "España" },
          stars: { type: "integer", minimum: 1, maximum: 5, example: 3 },
          imageUrls: { type: "array", items: { type: "string" } },
          startingPrice: { type: "number", example: 59.99 },
          managerName: { type: "string", example: "María López" },
        },
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          number: { type: "integer", example: 101 },
          type: { type: "string", enum: ["SINGLE", "DOUBLE", "SUITE"] },
          capacity: { type: "integer", example: 2 },
          price: { type: "number", example: 89.99 },
          hotelId: { type: "string", format: "uuid" },
          amenities: { type: "array", items: { type: "string" } },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          checkIn: { type: "string", format: "date-time" },
          checkOut: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED"],
          },
          totalPrice: { type: "number", example: 239.96 },
          hotelName: { type: "string" },
          roomNumber: { type: "integer" },
          roomType: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar un nuevo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Ana López" },
                  email: { type: "string", format: "email", example: "ana@email.com" },
                  password: {
                    type: "string",
                    description: "Mín. 8 caracteres, 1 mayúscula, 1 número, 1 símbolo",
                    example: "User123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Usuario creado" },
          400: { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          409: { description: "El email ya está registrado" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión y obtener un token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "juan@email.com" },
                  password: { type: "string", example: "User123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login correcto",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    token: { type: "string", description: "JWT (Bearer)" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Credenciales incorrectas" },
        },
      },
    },
    "/user/me": {
      get: {
        tags: ["Users"],
        summary: "Ver mi perfil",
        security: bearer,
        responses: { 200: { description: "Perfil del usuario autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, 401: { description: "No autenticado" } },
      },
      patch: {
        tags: ["Users"],
        summary: "Actualizar mi perfil",
        security: bearer,
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Perfil actualizado" }, 401: { description: "No autenticado" } },
      },
      delete: {
        tags: ["Users"],
        summary: "Eliminar mi cuenta",
        security: bearer,
        responses: { 200: { description: "Cuenta eliminada" }, 401: { description: "No autenticado" } },
      },
    },
    "/user": {
      get: {
        tags: ["Users"],
        summary: "Listar usuarios (MANAGER/ADMIN)",
        security: bearer,
        parameters: [
          { name: "name", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["USER", "MANAGER", "ADMIN"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { 200: { description: "Lista de usuarios" }, 403: { description: "Sin permisos" } },
      },
    },
    "/user/{id}": {
      get: {
        tags: ["Users"],
        summary: "Ver un usuario (MANAGER/ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Usuario" }, 404: { description: "No encontrado" } },
      },
      delete: {
        tags: ["Users"],
        summary: "Eliminar un usuario (ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Usuario eliminado" }, 403: { description: "Sin permisos" } },
      },
    },
    "/user/{id}/role": {
      patch: {
        tags: ["Users"],
        summary: "Cambiar el rol de un usuario (ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["role"], properties: { role: { type: "string", enum: ["USER", "MANAGER", "ADMIN"] } } } } },
        },
        responses: { 200: { description: "Rol actualizado" }, 400: { description: "Rol inválido o auto-cambio" } },
      },
    },
    "/hotel": {
      get: {
        tags: ["Hotels"],
        summary: "Listar hoteles (público, con filtros)",
        parameters: [
          { name: "name", in: "query", schema: { type: "string" } },
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "country", in: "query", schema: { type: "string" } },
          { name: "stars", in: "query", schema: { type: "integer" } },
          { name: "checkIn", in: "query", schema: { type: "string", format: "date" } },
          { name: "checkOut", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "Lista de hoteles", content: { "application/json": { schema: { type: "object", properties: { results: { type: "integer" }, hotels: { type: "array", items: { $ref: "#/components/schemas/Hotel" } } } } } } } },
      },
      post: {
        tags: ["Hotels"],
        summary: "Crear hotel (MANAGER)",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "city", "country", "stars"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  city: { type: "string" },
                  country: { type: "string" },
                  stars: { type: "integer", minimum: 1, maximum: 5 },
                  imageUrls: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Hotel creado" }, 403: { description: "Sin permisos" } },
      },
    },
    "/hotel/{id}": {
      get: {
        tags: ["Hotels"],
        summary: "Ver un hotel (público)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Hotel", content: { "application/json": { schema: { $ref: "#/components/schemas/Hotel" } } } }, 404: { description: "No encontrado" } },
      },
      patch: {
        tags: ["Hotels"],
        summary: "Actualizar hotel (MANAGER/ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Hotel actualizado" }, 403: { description: "Sin permisos" } },
      },
      delete: {
        tags: ["Hotels"],
        summary: "Eliminar hotel (MANAGER/ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Hotel eliminado" }, 403: { description: "Sin permisos" } },
      },
    },
    "/room": {
      get: {
        tags: ["Rooms"],
        summary: "Listar habitaciones (público)",
        parameters: [
          { name: "hotelId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["SINGLE", "DOUBLE", "SUITE"] } },
          { name: "checkIn", in: "query", schema: { type: "string", format: "date" } },
          { name: "checkOut", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { 200: { description: "Lista de habitaciones" } },
      },
      post: {
        tags: ["Rooms"],
        summary: "Crear habitación (MANAGER/ADMIN)",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["number", "type", "capacity", "price", "hotelId"],
                properties: {
                  number: { type: "integer" },
                  type: { type: "string", enum: ["SINGLE", "DOUBLE", "SUITE"] },
                  capacity: { type: "integer" },
                  price: { type: "number" },
                  hotelId: { type: "string", format: "uuid" },
                  amenities: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Habitación creada" }, 403: { description: "Sin permisos" } },
      },
    },
    "/room/{id}": {
      get: {
        tags: ["Rooms"],
        summary: "Ver una habitación (público)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Habitación", content: { "application/json": { schema: { $ref: "#/components/schemas/Room" } } } }, 404: { description: "No encontrada" } },
      },
      patch: {
        tags: ["Rooms"],
        summary: "Actualizar habitación (MANAGER/ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Habitación actualizada" }, 403: { description: "Sin permisos" } },
      },
      delete: {
        tags: ["Rooms"],
        summary: "Eliminar habitación (MANAGER/ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Habitación eliminada" }, 403: { description: "Sin permisos" } },
      },
    },
    "/booking": {
      get: {
        tags: ["Bookings"],
        summary: "Listar mis reservas (o todas si ADMIN / de sus hoteles si MANAGER)",
        security: bearer,
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED"] } }],
        responses: { 200: { description: "Lista de reservas", content: { "application/json": { schema: { type: "object", properties: { bookings: { type: "array", items: { $ref: "#/components/schemas/Booking" } } } } } } }, 401: { description: "No autenticado" } },
      },
      post: {
        tags: ["Bookings"],
        summary: "Crear una reserva",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["roomId", "checkIn", "checkOut"],
                properties: {
                  roomId: { type: "string", format: "uuid" },
                  checkIn: { type: "string", format: "date-time", example: "2027-03-01T12:00:00.000Z" },
                  checkOut: { type: "string", format: "date-time", example: "2027-03-05T12:00:00.000Z" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Reserva creada" }, 400: { description: "Fechas inválidas o solapadas" } },
      },
    },
    "/booking/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Ver una reserva",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Reserva" }, 404: { description: "No encontrada" } },
      },
      patch: {
        tags: ["Bookings"],
        summary: "Actualizar estado de una reserva (CONFIRMED/CANCELLED)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] } } } } },
        },
        responses: { 200: { description: "Reserva actualizada" } },
      },
      delete: {
        tags: ["Bookings"],
        summary: "Eliminar una reserva (ADMIN)",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Reserva eliminada" }, 403: { description: "Sin permisos" } },
      },
    },
    "/chat": {
      post: {
        tags: ["Chat"],
        summary: "Hablar con el asistente de IA (RAG + tools)",
        description:
          "Reenvía el mensaje al microservicio de IA (LangGraph). El token JWT es opcional: si se envía, el agente puede consultar las reservas del usuario.",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", example: "¿Puedo llevar a mi perro al hotel?" },
                  sessionId: { type: "string", description: "Identificador de sesión para mantener la memoria conversacional" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Respuesta del asistente",
            content: { "application/json": { schema: { type: "object", properties: { reply: { type: "string" }, sessionId: { type: "string" } } } } },
          },
          400: { description: "Mensaje vacío" },
          502: { description: "Error de comunicación con el servicio de IA" },
        },
      },
    },
    "/chat/history/{sessionId}": {
      get: {
        tags: ["Chat"],
        summary: "Obtener el historial de una sesión de chat",
        parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Historial de la conversación" } },
      },
    },
  },
};
