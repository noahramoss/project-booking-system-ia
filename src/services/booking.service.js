import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { sendN8nWebhook } from "../utils/webhook.js";

export class BookingService {
  static async createBooking(data, userId) {
    const { roomId, checkIn, checkOut } = data;

    const room = await prisma.room.findUnique({
      where: { id: roomId, isActive: true },
      select: { id: true, price: true, hotel: { select: { name: true, isActive: true } } },
    });

    if (!room || !room.hotel.isActive) {
      throw new AppError("La habitación especificada no existe o no está activa", 404);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new AppError("La fecha de checkOut debe ser posterior a checkIn", 400);
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { not: "CANCELLED" },
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } },
        ],
      },
    });

    if (conflictingBooking) {
      throw new AppError("La habitación no está disponible en las fechas seleccionadas", 409);
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(room.price) * nights;

    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
      },
      select: this._bookingSelect(),
    });

    const formattedBooking = this._formatBookingResponse(booking);

    // Enviamos evento a N8N
    sendN8nWebhook("BOOKING_CREATED", formattedBooking);
    
    return formattedBooking;
  }

  static async getBookings(filters, user) {
    const { status, page = 1, limit = 10 } = filters;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};
    if (status) where.status = status;

    if (user.role === "USER") {
      where.userId = user.id;
    } else if (user.role === "MANAGER") {
      where.room = { hotel: { managerId: user.id } };
    }

    const [bookings, totalRecords] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNumber,
        select: this._bookingSelect(),
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    const formattedBookings = bookings.map(this._formatBookingResponse);

    return {
      results: formattedBookings.length,
      pagination: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
      bookings: formattedBookings,
    };
  }

  static async getBookingById(id, user) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        ...this._bookingSelect(),
        userId: true,
        room: { select: { number: true, type: true, hotel: { select: { name: true, managerId: true } } } }
      },
    });

    if (!booking) {
      throw new AppError("Reserva no encontrada", 404);
    }

    if (user.role === "USER" && booking.userId !== user.id) {
      throw new AppError("No tienes permiso para ver esta reserva", 403);
    }

    if (user.role === "MANAGER" && booking.room.hotel.managerId !== user.id) {
      throw new AppError("No tienes permiso para ver esta reserva", 403);
    }

    return this._formatBookingResponse(booking);
  }

  static async updateBookingStatus(id, status, user) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      throw new AppError("Reserva no encontrada", 404);
    }

    if (booking.status === "CANCELLED") {
      throw new AppError("No se puede modificar una reserva cancelada", 400);
    }

    if (user.role === "USER") {
      if (booking.userId !== user.id) throw new AppError("No tienes permiso para modificar esta reserva", 403);
      if (status !== "CANCELLED") throw new AppError("Solo puedes cancelar tus reservas", 403);
    }

    if (user.role === "MANAGER") {
      if (booking.room.hotel.managerId !== user.id) {
        throw new AppError("No tienes permiso para modificar esta reserva", 403);
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      select: this._bookingSelect(),
    });

    return this._formatBookingResponse(updatedBooking);
  }

  static async deleteBooking(id) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError("Reserva no encontrada", 404);
    
    await prisma.booking.delete({ where: { id } });
    return { message: "Reserva eliminada con éxito" };
  }

  static _bookingSelect() {
    return {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      room: { select: { number: true, type: true, hotel: { select: { name: true, manager: { select: { name: true, email: true } } } } } },
    };
  }

  static _formatBookingResponse(booking) {
    return {
      ...booking,
      totalPrice: Number(booking.totalPrice),
      userName: booking.user.name,
      userEmail: booking.user.email,
      roomNumber: booking.room.number,
      roomType: booking.room.type,
      hotelName: booking.room?.hotel?.name,
      managerName: booking.room?.hotel?.manager?.name,
      managerEmail: booking.room?.hotel?.manager?.email,
    };
  }
}
