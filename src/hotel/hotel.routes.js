import { Router } from "express";
import {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
} from "./hotel.controller.js";
import { validateSchema } from "../middleware/validate.middleware.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { createHotelSchema, updateHotelSchema } from "./hotel.schema.js";

const router = Router();

// Endpoint: GET /api/hotel
router.get("/", getAllHotels);

// Endpoint: POST /api/hotel/create
router.post(
  "/",
  protect,
  restrictTo("MANAGER"),
  validateSchema(createHotelSchema),
  createHotel,
);

// Endpoint: GET /api/hotel
router.get("/:id", getHotelById);

// Endpoint: PATCH /api/hotel/:id
router.patch(
  "/:id",
  protect,
  restrictTo("MANAGER", "ADMIN"),
  validateSchema(updateHotelSchema),
  updateHotel,
);

// Endpoint: DELETE /api/hotel/:id
router.delete("/:id", protect, restrictTo("MANAGER", "ADMIN"), deleteHotel);

export default router;
