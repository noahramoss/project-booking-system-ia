import express from "express";
import { handleChat, getHistory } from "./chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// El endpoint POST /api/chat puede ser público (con optional auth) o protegido.
// Para que 'protect' sea opcional, podemos crear un middleware custom o usar 'protect' 
// pero manejar la excepción. Como tenemos req.user en el controller, asumimos que puede venir o no.
// Vamos a hacer una versión de 'protect' suave, que si hay token inyecta req.user, si no, lo ignora.

import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(); // Pasa sin usuario
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Si el token expira o es inválido, ignoramos y tratamos como anónimo
    console.log("Token inválido en optionalProtect:", error.message);
  }
  next();
};

router.post("/", optionalProtect, handleChat);
router.get("/history/:sessionId", optionalProtect, getHistory);

export default router;
