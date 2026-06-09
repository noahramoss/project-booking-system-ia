import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log("🌱 Iniciando seed de datos...\n");

  // ── Limpiar la BD ──
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Base de datos limpiada");

  // ── Crear usuarios ──
  const adminPassword = await bcrypt.hash("Admin123!", SALT_ROUNDS);
  const managerPassword = await bcrypt.hash("Manager123!", SALT_ROUNDS);
  const userPassword = await bcrypt.hash("User123!", SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Principal",
      email: "admin@bookingsystem.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: "Carlos García",
      email: "carlos@bookingsystem.com",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "María López",
      email: "maria@bookingsystem.com",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Juan Pérez",
      email: "juan@email.com",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Ana Martínez",
      email: "ana@email.com",
      passwordHash: userPassword,
      role: "USER",
    },
  });

  console.log("👤 Usuarios creados: admin, 2 managers, 2 users");

  // ── Crear hoteles ──
  const hotel1 = await prisma.hotel.create({
    data: {
      name: "Hotel Gran Vía Madrid",
      description:
        "Hotel de lujo en pleno centro de Madrid con vistas a la Gran Vía.",
      city: "Madrid",
      country: "España",
      stars: 5,
      managerId: manager1.id,
    },
  });

  const hotel2 = await prisma.hotel.create({
    data: {
      name: "Hotel Mediterráneo Barcelona",
      description: "Hotel frente al mar con acceso directo a la playa.",
      city: "Barcelona",
      country: "España",
      stars: 4,
      managerId: manager1.id,
    },
  });

  const hotel3 = await prisma.hotel.create({
    data: {
      name: "Hotel Sierra Nevada",
      description: "Hotel de montaña ideal para esquiadores y amantes de la naturaleza.",
      city: "Granada",
      country: "España",
      stars: 3,
      managerId: manager2.id,
    },
  });

  console.log("🏨 Hoteles creados: 3 hoteles");

  // ── Crear habitaciones ──
  const rooms = await Promise.all([
    // Hotel 1 - Gran Vía Madrid
    prisma.room.create({
      data: {
        number: 101,
        type: "SINGLE",
        capacity: 1,
        price: 89.99,
        hotelId: hotel1.id,
      },
    }),
    prisma.room.create({
      data: {
        number: 201,
        type: "DOUBLE",
        capacity: 2,
        price: 149.99,
        hotelId: hotel1.id,
      },
    }),
    prisma.room.create({
      data: {
        number: 301,
        type: "SUITE",
        capacity: 4,
        price: 299.99,
        hotelId: hotel1.id,
      },
    }),
    // Hotel 2 - Mediterráneo Barcelona
    prisma.room.create({
      data: {
        number: 101,
        type: "DOUBLE",
        capacity: 2,
        price: 129.99,
        hotelId: hotel2.id,
      },
    }),
    prisma.room.create({
      data: {
        number: 102,
        type: "SUITE",
        capacity: 3,
        price: 249.99,
        hotelId: hotel2.id,
      },
    }),
    // Hotel 3 - Sierra Nevada
    prisma.room.create({
      data: {
        number: 101,
        type: "SINGLE",
        capacity: 1,
        price: 59.99,
        hotelId: hotel3.id,
      },
    }),
    prisma.room.create({
      data: {
        number: 201,
        type: "DOUBLE",
        capacity: 2,
        price: 99.99,
        hotelId: hotel3.id,
      },
    }),
    prisma.room.create({
      data: {
        number: 301,
        type: "SUITE",
        capacity: 4,
        price: 189.99,
        hotelId: hotel3.id,
      },
    }),
  ]);

  console.log(`🛏️  Habitaciones creadas: ${rooms.length} habitaciones`);

  // ── Crear reservas ──
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: user1.id,
        roomId: rooms[1].id, // Double en Gran Vía
        checkIn: new Date("2026-06-15T14:00:00Z"),
        checkOut: new Date("2026-06-20T12:00:00Z"),
        status: "CONFIRMED",
        totalPrice: 149.99 * 5,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user1.id,
        roomId: rooms[3].id, // Double en Mediterráneo
        checkIn: new Date("2026-07-01T14:00:00Z"),
        checkOut: new Date("2026-07-04T12:00:00Z"),
        status: "PENDING",
        totalPrice: 129.99 * 3,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user2.id,
        roomId: rooms[2].id, // Suite en Gran Vía
        checkIn: new Date("2026-06-10T14:00:00Z"),
        checkOut: new Date("2026-06-13T12:00:00Z"),
        status: "CONFIRMED",
        totalPrice: 299.99 * 3,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user2.id,
        roomId: rooms[6].id, // Double en Sierra Nevada
        checkIn: new Date("2026-08-01T14:00:00Z"),
        checkOut: new Date("2026-08-05T12:00:00Z"),
        status: "PENDING",
        totalPrice: 99.99 * 4,
      },
    }),
    prisma.booking.create({
      data: {
        userId: user1.id,
        roomId: rooms[7].id, // Suite en Sierra Nevada
        checkIn: new Date("2026-09-01T14:00:00Z"),
        checkOut: new Date("2026-09-03T12:00:00Z"),
        status: "CANCELLED",
        totalPrice: 189.99 * 2,
      },
    }),
  ]);

  console.log(`📅 Reservas creadas: ${bookings.length} reservas`);

  // ── Resumen ──
  console.log("\n✅ Seed completado con éxito!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("   ADMIN:   admin@bookingsystem.com   / Admin123!");
  console.log("   MANAGER: carlos@bookingsystem.com  / Manager123!");
  console.log("   MANAGER: maria@bookingsystem.com   / Manager123!");
  console.log("   USER:    juan@email.com             / User123!");
  console.log("   USER:    ana@email.com              / User123!");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
