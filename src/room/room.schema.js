import { z } from "zod";

export const createRoomSchema = z.object({
  number: z
    .number({
      message:
        "El número de habitación es obligatorio y debe ser un valor numérico",
    })
    .int("El número de habitación debe ser un número entero")
    .positive("El número de habitación debe ser un número positivo"),

  type: z.enum(["SINGLE", "DOUBLE", "SUITE"], {
    message:
      "El tipo de habitación es obligatorio y debe ser SINGLE, DOUBLE o SUITE",
  }),

  capacity: z
    .number({
      message: "La capacidad es obligatoria y debe ser un valor numérico",
    })
    .int("La capacidad debe ser un número entero")
    .min(1, "La capacidad mínima es de 1 persona")
    .max(10, "La capacidad máxima permitida es de 10 personas"),

  price: z
    .number({
      message: "El precio es obligatorio y debe ser un valor numérico",
    })
    .positive("El precio debe ser un número mayor a 0"),

  hotelId: z
    .string({
      message: "El hotelId es obligatorio para asignar la habitación",
    })
    .trim()
    .uuid("El hotelId debe ser un UUID válido"),
});

// Para actualizaciones, permitimos que cualquier campo sea opcional
export const updateRoomSchema = createRoomSchema.partial();
