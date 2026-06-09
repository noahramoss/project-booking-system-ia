import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import {
  cleanDatabase,
  disconnectDatabase,
} from "./setup.js";

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  // ── Test 1: Registro exitoso ──
  it("POST /api/auth/register — debe registrar un usuario nuevo", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Nuevo Usuario",
      email: "nuevo@test.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Usuario registrado con éxito");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("nuevo@test.com");
    expect(res.body.user.role).toBe("USER");
    // No debe devolver la contraseña hasheada
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  // ── Test 2: Registro falla con email duplicado ──
  it("POST /api/auth/register — debe fallar con email duplicado", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Otro Usuario",
      email: "nuevo@test.com",
      password: "Password123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El email ya está en uso");
  });

  // ── Test 3: Login exitoso ──
  it("POST /api/auth/login — debe logear y devolver un token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nuevo@test.com",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Usuario logeado con éxito");
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("nuevo@test.com");
    // No debe devolver la contraseña hasheada
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  // ── Test 4: Login falla con credenciales incorrectas ──
  it("POST /api/auth/login — debe fallar con contraseña incorrecta", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nuevo@test.com",
      password: "ContraseñaMal123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales inválidas");
  });
});
