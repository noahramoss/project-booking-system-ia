import { z } from "zod";

// Validación estricta de contraseña (reutilizada de auth.schema.js)
const passwordValidation = z
  .string({
    message: "La contraseña es obligatoria",
  })
  .min(8, "La contraseña debe tener una longitud mínima de 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe tener al menos una mayúscula")
  .regex(/[0-9]/, "La contraseña debe tener al menos un número")
  .regex(
    /[^a-zA-Z0-9]/,
    "La contraseña debe tener al menos un carácter especial",
  )
  .max(255);

export const updateUserSchema = z.object({
  name: z
    .string({
      message: "El nombre debe ser una cadena de texto",
    })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .optional(),

  email: z
    .string({
      message: "El email debe ser una cadena de texto",
    })
    .trim()
    .email("Debe ser un email válido")
    .max(150, "El email no puede exceder los 150 caracteres")
    .optional(),

  password: passwordValidation.optional(),
});
