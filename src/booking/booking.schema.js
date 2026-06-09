import { z } from "zod";

export const createBookingSchema = z
  .object({
    roomId: z
      .string({
        message: "El roomId es obligatorio para asignar la reserva",
      })
      .trim()
      .uuid("El roomId debe ser un UUID válido"),

    checkIn: z
      .string({
        message:
          "La fecha de entrada (checkIn) es obligatoria y debe ser un string en formato ISO 8601",
      })
      .datetime(
        "El checkIn debe estar en formato ISO 8601 (ej: 2026-06-15T14:00:00.000Z)",
      ),

    checkOut: z
      .string({
        message:
          "La fecha de salida (checkOut) es obligatoria y debe ser un string en formato ISO 8601",
      })
      .datetime(
        "El checkOut debe estar en formato ISO 8601 (ej: 2026-06-20T12:00:00.000Z)",
      ),
  })
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message:
      "La fecha de salida (checkOut) debe ser posterior a la de entrada (checkIn)",
    path: ["checkOut"],
  });

export const updateBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"], {
    message: "El status es obligatorio y debe ser CONFIRMED o CANCELLED",
  }),
});
