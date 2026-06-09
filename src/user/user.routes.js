import { Router } from "express";
import { validateSchema } from "../middleware/validate.middleware.js";
import { updateUserSchema } from "./user.schema.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "./user.controller.js";

const router = Router();

// --- Rutas de perfil propio (cualquier usuario autenticado) ---

// Endpoint: GET /api/user/me
router.get("/me", protect, getMe);

// Endpoint: PATCH /api/user/me
router.patch("/me", protect, validateSchema(updateUserSchema), updateUser);

// Endpoint: DELETE /api/user/me
router.delete("/me", protect, deleteUser);

// --- Rutas de gestión de usuarios (MANAGER y ADMIN) ---

// Endpoint: GET /api/user
router.get("/", protect, restrictTo("MANAGER", "ADMIN"), getAllUsers);

// Endpoint: GET /api/user/:id
router.get("/:id", protect, restrictTo("MANAGER", "ADMIN"), getUserById);

// Endpoint: DELETE /api/user/:id
router.delete("/:id", protect, restrictTo("ADMIN"), deleteUser);

export default router;
