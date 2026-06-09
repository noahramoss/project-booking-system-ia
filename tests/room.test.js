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

describe("Room Endpoints", () => {
  let managerToken;
  let hotelId;

  beforeAll(async () => {
    await cleanDatabase();

    // Creamos un MANAGER y un hotel
    const { user: manager } = await createTestUser({
      name: "Manager Rooms",
      email: "managerrooms@test.com",
      password: "Password123!",
      role: "MANAGER",
    });

    managerToken = await loginAndGetToken(
      request,
      app,
      "managerrooms@test.com",
      "Password123!",
    );

    // Creamos un hotel directamente en la BD para el test
    const hotel = await prisma.hotel.create({
      data: {
        name: "Hotel Rooms Test",
        city: "Barcelona",
        country: "España",
        stars: 3,
        managerId: manager.id,
      },
    });
    hotelId = hotel.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectDatabase();
  });

  // ── Test 7: Crear habitación en un hotel ──
  it("POST /api/room — debe crear una habitación como MANAGER", async () => {
    const res = await request(app)
      .post("/api/room")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        number: 101,
        type: "DOUBLE",
        capacity: 2,
        price: 120.5,
        hotelId: hotelId,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Habitación creada con éxito");
    expect(res.body.room).toHaveProperty("id");
    expect(res.body.room.number).toBe(101);
    expect(res.body.room.type).toBe("DOUBLE");
    expect(res.body.room.hotelName).toBe("Hotel Rooms Test");
  });
});
