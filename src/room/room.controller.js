import prisma from "../config/prisma.js"; // Ajusta la ruta a tu archivo prisma
import AppError from "../utils/AppError.js"; // Ajusta la ruta a tu manejador de errores

export const createRoom = async (req, res, next) => {
  try {
    const { number, type, capacity, price, hotelId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Verificar si el hotel existe
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      return next(new AppError("El hotel especificado no existe", 404));
    }

    // 2. Verificar autorización (El Candado)
    // Permitimos el paso si es ADMIN, o si es MANAGER y es el dueño del hotel
    if (userRole !== "ADMIN" && hotel.managerId !== userId) {
      return next(
        new AppError(
          "No tienes permiso para añadir habitaciones a este hotel",
          403,
        ),
      );
    }

    // 3. Evitar duplicados (Habitación 101 dos veces en el mismo hotel)
    // Prisma nos permite buscar por campos únicos combinados gracias a tu @@unique
    const existingRoom = await prisma.room.findUnique({
      where: {
        hotelId_number: {
          hotelId: hotelId,
          number: number,
        },
      },
    });

    if (existingRoom) {
      return next(
        new AppError(
          `El hotel '${hotel.name}' ya tiene una habitación con el número ${number}`,
          400,
        ),
      );
    }

    // 4. Todo seguro. Creamos la habitación.
    const room = await prisma.room.create({
      data: {
        ...req.body,
      },
      select: {
        id: true,
        number: true,
        type: true,
        capacity: true,
        price: true,
        hotelId: true,
        hotel: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedRoom = {
      ...room,
      price: Number(room.price),
      hotelName: room.hotel.name,
      hotel: undefined,
    };

    res.status(201).json({
      message: "Habitación creada con éxito",
      room: formattedRoom,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRooms = async (req, res, next) => {
  try {
    const { hotelName, hotelId, type, checkIn, checkOut, page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Construimos el filtro dinámico
    const where = {};
    if (hotelName) {
      where.hotel = {
        name: {
          contains: hotelName,
          mode: "insensitive",
        },
      };
    }
    if (hotelId) where.hotelId = hotelId;
    if (type) where.type = type; // SINGLE, DOUBLE, SUITE

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return next(new AppError("Las fechas checkIn y checkOut deben tener un formato válido", 400));
      }
      if (checkInDate >= checkOutDate) {
        return next(new AppError("La fecha de checkOut debe ser posterior a la de checkIn", 400));
      }

      where.bookings = {
        none: {
          status: { not: "CANCELLED" },
          AND: [
            { checkIn: { lt: checkOutDate } },
            { checkOut: { gt: checkInDate } }
          ]
        }
      };
    }

    const [rooms, totalRecords] = await Promise.all([
      prisma.room.findMany({
        where,
        skip: skip,
        take: limitNumber,
        select: {
          id: true,
          number: true,
          type: true,
          capacity: true,
          price: true,
          hotelId: true,
          hotel: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { price: "asc" }, // Ordenar por precio más bajo por defecto
      }),
      prisma.room.count({ where }),
    ]);

    const formattedRooms = rooms.map((room) => ({
      ...room,
      price: Number(room.price),
      hotelName: room.hotel.name,
      hotel: undefined,
    }));

    res.status(200).json({
      results: formattedRooms.length,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
      },
      rooms: formattedRooms,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        number: true,
        type: true,
        capacity: true,
        price: true,
        hotelId: true,
        hotel: {
          select: {
            name: true,
            city: true,
            stars: true,
          },
        },
      },
    });

    if (!room) {
      return next(new AppError("Habitación no encontrada", 404));
    }

    const formattedRoom = {
      ...room,
      price: Number(room.price),
      hotelName: room.hotel.name,
      hotelCity: room.hotel.city,
      hotelStars: room.hotel.stars,
      hotel: undefined,
    };

    res.status(200).json(formattedRoom);
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { number, hotelId } = req.body;

    // 1. Buscamos la habitación INCLUYENDO los datos de su hotel
    const room = await prisma.room.findUnique({
      where: { id },
      include: { hotel: true }, // Vital para comprobar el managerId
    });

    if (!room) return next(new AppError("Habitación no encontrada", 404));

    // 2. El Candado de Propiedad
    if (userRole !== "ADMIN" && room.hotel.managerId !== userId) {
      return next(
        new AppError("No tienes permiso para modificar esta habitación", 403),
      );
    }

    // 3. Si intentan cambiar el número de habitación, verificar duplicados
    if (number && number !== room.number) {
      const existingRoom = await prisma.room.findUnique({
        where: {
          hotelId_number: {
            hotelId: hotelId || room.hotelId, // Usa el nuevo hotelId si se envía, si no el actual
            number: number,
          },
        },
      });

      if (existingRoom) {
        return next(
          new AppError(`Ya existe la habitación ${number} en este hotel`, 400),
        );
      }
    }

    // 4. Actualizamos
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { ...req.body },
      select: {
        id: true,
        number: true,
        type: true,
        capacity: true,
        price: true,
        hotelId: true,
        hotel: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedUpdatedRoom = {
      ...updatedRoom,
      price: Number(updatedRoom.price),
      hotelName: updatedRoom.hotel.name,
      hotel: undefined,
    };

    res.status(200).json({
      message: "Habitación actualizada correctamente",
      room: formattedUpdatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Buscamos la habitación con su hotel
    const room = await prisma.room.findUnique({
      where: { id },
      include: { hotel: true },
    });

    if (!room) return next(new AppError("Habitación no encontrada", 404));

    // 2. El Candado de Propiedad
    if (userRole !== "ADMIN" && room.hotel.managerId !== userId) {
      return next(
        new AppError("No tienes permiso para eliminar esta habitación", 403),
      );
    }

    // 3. Eliminamos
    await prisma.room.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Habitación eliminada con éxito",
    });
  } catch (error) {
    next(error);
  }
};
