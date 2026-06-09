// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
    // Si trae detalles (como los de Zod), los enviamos en el JSON
    if (err.details) {
      return res.status(err.statusCode).json({
        error: err.message,
        detalles: err.details,
      });
    }
    // Si es un error normal (ej: "Credenciales inválidas"), enviamos lo de siempre
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error("ERROR NO ESPERADO:", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
};

export default errorHandler;
