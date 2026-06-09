import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export const createBooking = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;
    const userId = req.user.id;

    // 1. Verificar que la habitación existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        price: true,
        hotel: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!room) {
      return next(new AppError("La habitación especificada no existe", 404));
    }

    // 2. Verificar disponibilidad (que no haya reservas solapadas y activas)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { not: "CANCELLED" },
        AND: [
          { checkIn: { lt: new Date(checkOut) } },
          { checkOut: { gt: new Date(checkIn) } },
        ],
      },
    });

    if (conflictingBooking) {
      return next(
        new AppError(
          "La habitación no está disponible en las fechas seleccionadas",
          409,
        ),
      );
    }

    // 3. Calcular el precio total (nº de noches × precio por noche)
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = Number(room.price) * nights;

    // 4. Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            number: true,
            type: true,
            hotel: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 5. Aplanar la respuesta
    const formattedBooking = {
      ...booking,
      totalPrice: Number(booking.totalPrice),
      userName: booking.user.name,
      userEmail: booking.user.email,
      roomNumber: booking.room.number,
      roomType: booking.room.type,
      hotelName: booking.room.hotel.name,
      user: undefined,
      room: undefined,
    };

    res.status(201).json({
      message: "Reserva creada con éxito",
      booking: formattedBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Construimos el filtro dinámico
    const where = {};

    if (status) where.status = status;

    // Lógica de permisos: cada rol ve lo que le corresponde
    if (req.user.role === "USER") {
      // El USER solo puede ver sus propias reservas
      where.userId = req.user.id;
    } else if (req.user.role === "MANAGER") {
      // El MANAGER solo ve reservas de habitaciones de sus hoteles
      where.room = {
        hotel: {
          managerId: req.user.id,
        },
      };
    }
    // ADMIN: no se filtra, ve todas las reservas

    const [bookings, totalRecords] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: skip,
        take: limitNumber,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          room: {
            select: {
              number: true,
              type: true,
              hotel: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      totalPrice: Number(booking.totalPrice),
      userName: booking.user.name,
      userEmail: booking.user.email,
      roomNumber: booking.room.number,
      roomType: booking.room.type,
      hotelName: booking.room.hotel.name,
      user: undefined,
      room: undefined,
    }));

    res.status(200).json({
      results: formattedBookings.length,
      pagination: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
      bookings: formattedBookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            number: true,
            type: true,
            hotel: {
              select: {
                name: true,
                managerId: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return next(new AppError("Reserva no encontrada", 404));
    }

    // Candado de propiedad
    if (
      req.user.role === "USER" &&
      booking.userId !== req.user.id
    ) {
      return next(
        new AppError("No tienes permiso para ver esta reserva", 403),
      );
    }

    if (
      req.user.role === "MANAGER" &&
      booking.room.hotel.managerId !== req.user.id
    ) {
      return next(
        new AppError("No tienes permiso para ver esta reserva", 403),
      );
    }

    const formattedBooking = {
      ...booking,
      totalPrice: Number(booking.totalPrice),
      userName: booking.user.name,
      userEmail: booking.user.email,
      roomNumber: booking.room.number,
      roomType: booking.room.type,
      hotelName: booking.room.hotel.name,
      userId: undefined,
      user: undefined,
      room: undefined,
    };

    res.status(200).json(formattedBooking);
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Buscamos la reserva incluyendo la relación room → hotel
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: { hotel: true },
        },
      },
    });

    if (!booking) {
      return next(new AppError("Reserva no encontrada", 404));
    }

    // 2. No se puede modificar una reserva ya cancelada
    if (booking.status === "CANCELLED") {
      return next(
        new AppError("No se puede modificar una reserva cancelada", 400),
      );
    }

    // 3. Permisos según rol
    if (userRole === "USER") {
      // El USER solo puede cancelar sus propias reservas
      if (booking.userId !== userId) {
        return next(
          new AppError("No tienes permiso para modificar esta reserva", 403),
        );
      }
      if (status !== "CANCELLED") {
        return next(
          new AppError("Solo puedes cancelar tus reservas", 403),
        );
      }
    }

    if (userRole === "MANAGER") {
      // El MANAGER puede confirmar/cancelar reservas de sus hoteles
      if (booking.room.hotel.managerId !== userId) {
        return next(
          new AppError("No tienes permiso para modificar esta reserva", 403),
        );
      }
    }
    // ADMIN: puede cambiar cualquier status de cualquier reserva

    // 4. Actualizamos
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            number: true,
            type: true,
            hotel: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const formattedBooking = {
      ...updatedBooking,
      totalPrice: Number(updatedBooking.totalPrice),
      userName: updatedBooking.user.name,
      userEmail: updatedBooking.user.email,
      roomNumber: updatedBooking.room.number,
      roomType: updatedBooking.room.type,
      hotelName: updatedBooking.room.hotel.name,
      user: undefined,
      room: undefined,
    };

    res.status(200).json({
      message: "Reserva actualizada correctamente",
      booking: formattedBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Verificar que la reserva existe
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(new AppError("Reserva no encontrada", 404));
    }

    // 2. Eliminamos (solo ADMIN puede llegar aquí gracias al restrictTo en las rutas)
    await prisma.booking.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Reserva eliminada con éxito",
    });
  } catch (error) {
    next(error);
  }
};
