import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import {
  createTestUser,
  loginAndGetToken,
  cleanDatabase,
  disconnectDatabase,
} from "./setup.js";

describe("Hotel Endpoints", () => {
  let managerToken;

  beforeAll(async () => {
    await cleanDatabase();

    // Creamos un MANAGER para poder crear hoteles
    await createTestUser({
      name: "Manager Test",
      email: "manager@test.com",
      password: "Password123!",
      role: "MANAGER",
    });

    managerToken = await loginAndGetToken(
      request,
      app,
      "manager@test.com",
      "Password123!",
    );
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  // ── Test 5: Crear hotel como MANAGER ──
  it("POST /api/hotel — debe crear un hotel como MANAGER", async () => {
    const res = await request(app)
      .post("/api/hotel")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "Hotel Test",
        city: "Madrid",
        country: "España",
        stars: 4,
        description: "Hotel de prueba para tests",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Hotel creado con éxito");
    expect(res.body.hotel).toHaveProperty("id");
    expect(res.body.hotel.name).toBe("Hotel Test");
    expect(res.body.hotel.managerName).toBe("Manager Test");
  });

  // ── Test 6: Listar hoteles ──
  it("GET /api/hotel — debe listar los hoteles con paginación", async () => {
    const res = await request(app).get("/api/hotel");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("results");
    expect(res.body).toHaveProperty("pagination");
    expect(res.body).toHaveProperty("hotels");
    expect(res.body.results).toBeGreaterThanOrEqual(1);
    expect(res.body.hotels[0]).toHaveProperty("managerName");
    // Verificamos que la respuesta está aplanada (sin objeto manager anidado)
    expect(res.body.hotels[0].manager).toBeUndefined();
  });
});
