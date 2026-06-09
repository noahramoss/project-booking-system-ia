import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import {
  createTestUser,
  loginAndGetToken,
  cleanDatabase,
  disconnectDatabase,
  prisma,
} from "./setup.js";

describe("Booking Endpoints", () => {
  let userToken;
  let roomId;

  beforeAll(async () => {
    await cleanDatabase();

    // 1. Crear un MANAGER con hotel y habitación
    const { user: manager } = await createTestUser({
      name: "Manager Booking",
      email: "managerbooking@test.com",
      password: "Password123!",
      role: "MANAGER",
    });

    const hotel = await prisma.hotel.create({
      data: {
        name: "Hotel Booking Test",
        city: "Sevilla",
        country: "España",
        stars: 5,
        managerId: manager.id,
      },
    });

    const room = await prisma.room.create({
      data: {
        number: 201,
        type: "SUITE",
        capacity: 2,
        price: 200.0,
        hotelId: hotel.id,
      },
    });
    roomId = room.id;

    // 2. Crear un USER normal para hacer reservas
    await createTestUser({
      name: "User Booking",
      email: "userbooking@test.com",
      password: "Password123!",
      role: "USER",
    });

    userToken = await loginAndGetToken(
      request,
      app,
      "userbooking@test.com",
      "Password123!",
    );
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  // ── Test 8: Crear reserva como USER ──
  it("POST /api/booking — debe crear una reserva", async () => {
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        roomId: roomId,
        checkIn: "2026-07-01T14:00:00.000Z",
        checkOut: "2026-07-05T12:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Reserva creada con éxito");
    expect(res.body.booking).toHaveProperty("id");
    expect(res.body.booking.roomNumber).toBe(201);
    expect(res.body.booking.hotelName).toBe("Hotel Booking Test");
    expect(res.body.booking.status).toBe("PENDING");
    // 4 noches × 200€ = 800€
    expect(res.body.booking.totalPrice).toBe(800);
  });

  // ── Test 9: Reserva falla por conflicto de fechas ──
  it("POST /api/booking — debe fallar si las fechas se solapan", async () => {
    const res = await request(app)
      .post("/api/booking")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        roomId: roomId,
        checkIn: "2026-07-03T14:00:00.000Z",
        checkOut: "2026-07-08T12:00:00.000Z",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(
      "La habitación no está disponible en las fechas seleccionadas",
    );
  });

  // ── Test 10: Acceder sin token devuelve 401 ──
  it("GET /api/booking — debe devolver 401 sin token", async () => {
    const res = await request(app).get("/api/booking");

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("No has iniciado sesión");
  });
});
