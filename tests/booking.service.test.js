import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { BookingService } from "../src/services/booking.service.js";
import { prisma, cleanDatabase, disconnectDatabase, createTestUser } from "./setup.js";

describe("BookingService", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("debe crear una reserva correctamente si las fechas no se solapan", async () => {
    const { user: manager } = await createTestUser({ role: "MANAGER", email: "manager@test.com" });
    const { user } = await createTestUser({ role: "USER", email: "user@test.com" });

    const hotel = await prisma.hotel.create({
      data: {
        name: "Booking Service Hotel",
        city: "City",
        country: "Country",
        stars: 3,
        managerId: manager.id
      }
    });

    const room = await prisma.room.create({
      data: {
        number: 101,
        type: "SINGLE",
        capacity: 1,
        price: 50,
        hotelId: hotel.id
      }
    });

    const bookingData = {
      roomId: room.id,
      checkIn: "2026-10-01",
      checkOut: "2026-10-05"
    };

    const booking = await BookingService.createBooking(bookingData, user.id);
    
    expect(booking).toHaveProperty("id");
    expect(booking.roomNumber).toBe(101);
    expect(booking.hotelName).toBe("Booking Service Hotel");
    expect(Number(booking.totalPrice)).toBe(200); // 4 noches * 50
  });

  it("debe rechazar una reserva si las fechas están solapadas", async () => {
    const { user: manager } = await createTestUser({ role: "MANAGER", email: "manager2@test.com" });
    const { user: user1 } = await createTestUser({ role: "USER", email: "user1@test.com" });
    const { user: user2 } = await createTestUser({ role: "USER", email: "user2@test.com" });

    const hotel = await prisma.hotel.create({
      data: {
        name: "Overlap Hotel",
        city: "OverlapCity",
        country: "OverlapCountry",
        stars: 4,
        managerId: manager.id
      }
    });

    const room = await prisma.room.create({
      data: {
        number: 201,
        type: "DOUBLE",
        capacity: 2,
        price: 100,
        hotelId: hotel.id
      }
    });

    // Reserva inicial
    await BookingService.createBooking({
      roomId: room.id,
      checkIn: "2026-11-01",
      checkOut: "2026-11-10"
    }, user1.id);

    // Intentamos reservar pisando esas fechas
    await expect(BookingService.createBooking({
      roomId: room.id,
      checkIn: "2026-11-05",
      checkOut: "2026-11-15"
    }, user2.id))
      .rejects
      .toThrow(); // La habitación no está disponible
  });
});
