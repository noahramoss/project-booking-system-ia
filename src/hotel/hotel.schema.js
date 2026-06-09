import { z } from "zod";

export const createHotelSchema = z.object({
  name: z
    .string({
      message: "El nombre es obligatorio y debe ser texto",
    })
    .trim()
    .min(2, "El nombre del hotel debe tener al menos 2 caracteres")
    .max(200, "El nombre no puede exceder los 200 caracteres"),

  description: z
    .string({
      message: "La descripción debe ser una cadena de texto",
    })
    .trim()
    .optional(),

  city: z
    .string({
      message: "La ciudad es obligatoria y debe ser texto",
    })
    .trim()
    .min(1, "La ciudad no puede estar vacía")
    .max(100, "La ciudad no puede exceder los 100 caracteres"),

  country: z
    .string({
      message: "El país es obligatorio y debe ser texto",
    })
    .trim()
    .min(1, "El país no puede estar vacío")
    .max(100, "El país no puede exceder los 100 caracteres"),

  stars: z
    .number({
      message: "El número de estrellas es obligatorio y debe ser un número",
    })
    .int("Las estrellas deben ser un número entero (ej: 3, 4, 5)")
    .min(1, "El hotel debe tener al menos 1 estrella")
    .max(5, "El hotel no puede tener más de 5 estrellas"),
});

// Convierte todos los campos de createHotelSchema en opcionales.
// Si el cliente envía un campo, Zod validará sus reglas (incluyendo los mensajes personalizados).
// Si no lo envía, Zod simplemente lo ignora.
export const updateHotelSchema = createHotelSchema.partial();
