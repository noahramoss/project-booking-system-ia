// src/middleware/validate.middleware.js
import AppError from "../utils/AppError.js";

export const validateSchema = (schema) => {
  return (req, res, next) => {
    // 1. safeParse NO explota. Devuelve un objeto con el resultado.
    const result = schema.safeParse(req.body);

    // 2. Comprobamos si la validación falló
    if (!result.success) {
      // En safeParse, los errores viven dentro de result.error.issues
      // Extraemos el nombre del campo y el mensaje, por ejemplo: "city: La ciudad es obligatoria"
      const erroresZod = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
      // Lanzamos nuestro AppError controlado
      return next(
        new AppError("Error de validación de datos", 400, erroresZod),
      );
    }

    // 3. (OPCIONAL PERO RECOMENDADO) Reemplazamos el req.body con los datos limpios de Zod.
    // Esto es útil porque Zod elimina campos basura que el usuario haya enviado
    // y que no estén en tu esquema, y aplica los .default()
    req.body = result.data;

    // 4. Todo perfecto, abrimos la puerta al controlador
    next();
  };
};
