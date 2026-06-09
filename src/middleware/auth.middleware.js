// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import prisma from "../config/prisma.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "No has iniciado sesión. Por favor, inicia sesión para acceder.",
          401,
        ),
      );
    }

    // jwt.verify usa tu palabra secreta para saber si alguien modificó el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!currentUser) {
      return next(
        new AppError(
          "El usuario al que pertenece este token ya no existe.",
          401,
        ),
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(
        new AppError("Tóken inválido. Por favor, inicia sesión de nuevo.", 401),
      );
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(
          "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
          401,
        ),
      );
    }
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("No tienes permiso para realizar esta acción", 403),
      );
    }
    next();
  };
};
