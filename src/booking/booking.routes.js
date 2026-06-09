import { Router } from "express";
import { validateSchema } from "../middleware/validate.middleware.js";
import {
  createBookingSchema,
  updateBookingSchema,
} from "./booking.schema.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "./booking.controller.js";

const router = Router();

// Endpoint: GET /api/booking
router.get("/", protect, getAllBookings);

// Endpoint: POST /api/booking
router.post("/", protect, validateSchema(createBookingSchema), createBooking);

// Endpoint: GET /api/booking/:id
router.get("/:id", protect, getBookingById);

// Endpoint: PATCH /api/booking/:id
router.patch(
  "/:id",
  protect,
  validateSchema(updateBookingSchema),
  updateBooking,
);

// Endpoint: DELETE /api/booking/:id
router.delete("/:id", protect, restrictTo("ADMIN"), deleteBooking);

export default router;
