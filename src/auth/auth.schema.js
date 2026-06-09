import { z } from "zod";

// Esta validación estricta SOLO se usa al crear o cambiar la contraseña
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

export const registerSchema = z.object({
  name: z
    .string({
      message: "El nombre es obligatorio y debe ser una cadena de texto",
    })
    .trim() // 👈 Limpia espacios al inicio y final
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  email: z
    .string({
      message: "El email es obligatorio",
    })
    .trim()
    .email("Debe ser un email válido")
    .max(150),
  password: passwordValidation,
  role: z.enum(["USER", "MANAGER", "ADMIN"]).default("USER"),
});

export const loginSchema = z.object({
  email: z
    .string({
      message: "El email es obligatorio",
    })
    .trim()
    .email("Debe ser un email válido"),
  //Para login, solo exigimos que envíe un string. Bcrypt se encarga del resto.
  password: z
    .string({
      message: "La contraseña es obligatoria",
    })
    .min(1, "La contraseña no puede estar vacía"),
});
