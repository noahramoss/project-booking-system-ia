import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

const SALT_ROUNDS = 10;

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError("Usuario no encontrado", 404));
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, name, page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Construimos el filtro dinámico
    const where = {};

    if (name) where.name = { contains: name, mode: "insensitive" };
    if (role) where.role = role;

    // Lógica de permisos:
    // MANAGER solo ve usuarios que tienen reservas en sus hoteles
    if (req.user.role === "MANAGER") {
      where.bookings = {
        some: {
          room: {
            hotel: {
              managerId: req.user.id,
            },
          },
        },
      };
    }
    // ADMIN: no se filtra, ve todos los usuarios

    const [users, totalRecords] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: skip,
        take: limitNumber,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      results: users.length,
      pagination: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            hotels: true,
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError("Usuario no encontrado", 404));
    }

    // Si es MANAGER, verificar que el usuario tenga reservas en sus hoteles
    if (req.user.role === "MANAGER") {
      const hasBookingsInMyHotels = await prisma.booking.findFirst({
        where: {
          userId: req.params.id,
          room: {
            hotel: {
              managerId: req.user.id,
            },
          },
        },
      });

      if (!hasBookingsInMyHotels) {
        return next(
          new AppError("No tienes permiso para ver este usuario", 403),
        );
      }
    }

    // Aplanamos el _count
    const formattedUser = {
      ...user,
      totalHotels: user._count.hotels,
      totalBookings: user._count.bookings,
      _count: undefined,
    };

    res.status(200).json(formattedUser);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user.id;

    // Si envía un email nuevo, verificar que no esté en uso por otro usuario
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return next(new AppError("El email ya está en uso", 400));
      }
    }

    // Preparamos los datos a actualizar
    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;

    // Si envía nueva contraseña, la hasheamos
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    // Si la ruta es /me, el usuario se elimina a sí mismo
    // Si la ruta es /:id, solo ADMIN puede llegar aquí (restrictTo en la ruta)
    const targetId = req.params.id || req.user.id;

    // Un ADMIN no puede eliminarse a sí mismo
    if (targetId === req.user.id && req.user.role === "ADMIN") {
      return next(
        new AppError(
          "Un administrador no puede eliminarse a sí mismo",
          400,
        ),
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!user) {
      return next(new AppError("Usuario no encontrado", 404));
    }

    // Eliminamos (la cascada se encarga de borrar hoteles, rooms y bookings)
    await prisma.user.delete({
      where: { id: targetId },
    });

    res.status(200).json({
      message: "Usuario eliminado con éxito",
    });
  } catch (error) {
    next(error);
  }
};
