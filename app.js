import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import errorHandler from "./src/middleware/errorHandler.js";
import authRoutes from "./src/auth/auth.routes.js";
import userRoutes from "./src/user/user.routes.js";
import hotelRoutes from "./src/hotel/hotel.routes.js";
import roomRoutes from "./src/room/room.routes.js";
import bookingRoutes from "./src/booking/booking.routes.js";
import chatRoutes from "./src/chat/chat.routes.js";

const app = express();

// 1. Seguridad de cabeceras HTTP
app.use(helmet());

// 2. Configuración CORS segura
// Orígenes de desarrollo + el dominio del frontend desplegado (FRONTEND_URL)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

// 3. Limitación de peticiones (Rate Limiting) para prevenir fuerza bruta/DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite de 500 peticiones por IP para evitar bloqueos rápidos en desarrollo
  message: {
    message:
      "Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.",
  },
});
// Aplicamos el limitador a todas las rutas que comiencen por /api
app.use("/api", limiter);

app.use(express.json());

// Logger HTTP - solo en desarrollo (no en tests para mantener la salida limpia)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/chat", chatRoutes);

app.use(errorHandler); //Siempre debe ir el último

export default app;
