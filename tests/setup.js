import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

/**
 * Crea un usuario de test y devuelve su objeto + contraseña sin hashear.
 */
export const createTestUser = async ({
  name = "Test User",
  email = "testuser@test.com",
  password = "Password123!",
  role = "USER",
} = {}) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  return { user, password };
};

/**
 * Obtiene un token JWT haciendo login real contra la API.
 */
export const loginAndGetToken = async (request, app, email, password) => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return res.body.token;
};

/**
 * Limpia todas las tablas de la BD en el orden correcto (por dependencias FK).
 */
export const cleanDatabase = async () => {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.user.deleteMany();
};

/**
 * Desconecta Prisma al finalizar los tests.
 */
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

export { prisma };
