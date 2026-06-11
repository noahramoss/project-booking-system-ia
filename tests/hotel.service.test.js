import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { HotelService } from "../src/services/hotel.service.js";
import { prisma, cleanDatabase, disconnectDatabase, createTestUser } from "./setup.js";

describe("HotelService", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("debe crear un hotel exitosamente con los datos correctos", async () => {
    const { user: manager } = await createTestUser({ email: "manager1@test.com", role: "MANAGER" });
    const hotelData = {
      name: "Servicio Hotel Test",
      description: "Un hotel de prueba para el servicio",
      city: "TestCity",
      country: "TestCountry",
      stars: 5,
      imageUrls: ["url1"]
    };

    const result = await HotelService.createHotel(hotelData, manager.id);
    expect(result).toHaveProperty("id");
    expect(result.name).toBe(hotelData.name);
    expect(result.imageUrls).toEqual(["url1"]);
    expect(result.stars).toBe(hotelData.stars);
  });

  it("debe lanzar un error si ya existe un hotel con ese nombre", async () => {
    const { user: manager } = await createTestUser({ email: "manager_dup@test.com", role: "MANAGER" });
    const hotelData = {
      name: "Hotel Duplicado",
      city: "City",
      country: "Country",
      stars: 4
    };

    await HotelService.createHotel(hotelData, manager.id);

    await expect(HotelService.createHotel(hotelData, manager.id))
      .rejects
      .toThrow("Ya existe un hotel registrado con el nombre 'Hotel Duplicado'");
  });
});
