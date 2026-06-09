import { Router } from "express";
import { register, login } from "./auth.controller.js";
import { validateSchema } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Endpoint: POST /api/auth/register
router.post("/register", validateSchema(registerSchema), register);

// Endpoint: POST /api/auth/login
router.post("/login", validateSchema(loginSchema), login);

export default router;
