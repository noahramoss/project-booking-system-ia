import { Router } from "express";
import { validateSchema } from "../middleware/validate.middleware.js";
import { createRoomSchema, updateRoomSchema } from "./room.schema.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from "./room.controller.js";

const router = Router();

// Endpoint: GET /api/room
router.get("/", getAllRooms);

// Endpoint: POST /api/room
router.post(
  "/",
  protect,
  restrictTo("MANAGER", "ADMIN"),
  validateSchema(createRoomSchema),
  createRoom,
);

// Endpoint: GET /api/room/:id
router.get("/:id", getRoomById);

// Endpoint: PATCH /api/room/:id
router.patch(
  "/:id",
  protect,
  restrictTo("MANAGER", "ADMIN"),
  validateSchema(updateRoomSchema),
  updateRoom,
);

// Endpoint: DELETE /api/room/:id
router.delete("/:id", protect, restrictTo("MANAGER", "ADMIN"), deleteRoom);

export default router;
