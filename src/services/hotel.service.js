import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export class HotelService {
  /**
   * Search hotels with pagination and filters
   */
  static async searchHotels(filters) {
    const {
      name, city, country, stars,
      page = 1, limit = 10,
      checkIn, checkOut,
      capacity, minPrice, maxPrice,
      sortBy, sortOrder = "asc"
    } = filters;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const where = { isActive: true }; // Only active hotels

    if (name) where.name = { contains: name, mode: "insensitive" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (stars) where.stars = parseInt(stars);

    const roomConditions = { isActive: true };

    if (capacity) {
      roomConditions.capacity = { gte: parseInt(capacity) };
    }

    if (minPrice || maxPrice) {
      roomConditions.price = {};
      if (minPrice) roomConditions.price.gte = parseFloat(minPrice);
      if (maxPrice) roomConditions.price.lte = parseFloat(maxPrice);
    }

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new AppError("Las fechas checkIn y checkOut deben tener un formato válido", 400);
      }
      if (checkInDate >= checkOutDate) {
        throw new AppError("La fecha de checkOut debe ser posterior a la de checkIn", 400);
      }

      roomConditions.bookings = {
        none: {
          status: { not: "CANCELLED" },
          AND: [
            { checkIn: { lt: checkOutDate } },
            { checkOut: { gt: checkInDate } }
          ]
        }
      };
    }

    if (Object.keys(roomConditions).length > 1 || roomConditions.bookings || roomConditions.price) {
      where.rooms = { some: roomConditions };
    }

    let hotels = [];
    let totalHotels = 0;

    if (sortBy === "price") {
      const roomsWithHotelFilters = await prisma.room.findMany({
        where: { ...roomConditions, hotel: where },
        orderBy: { price: sortOrder === "desc" ? "desc" : "asc" },
        select: { hotelId: true, price: true },
      });

      const distinctHotelIds = [];
      const startingPrices = {};

      for (const r of roomsWithHotelFilters) {
        if (!distinctHotelIds.includes(r.hotelId)) {
          distinctHotelIds.push(r.hotelId);
          startingPrices[r.hotelId] = Number(r.price);
        }
      }

      totalHotels = distinctHotelIds.length;
      const paginatedHotelIds = distinctHotelIds.slice(skip, skip + limitNumber);

      if (paginatedHotelIds.length > 0) {
        const fetchedHotels = await prisma.hotel.findMany({
          where: { id: { in: paginatedHotelIds } },
          select: this._hotelSelect(),
        });

        hotels = paginatedHotelIds.map(id => {
          const hotel = fetchedHotels.find(h => h.id === id);
          return { ...hotel, startingPrice: startingPrices[id] };
        });
      }
    } else {
      const orderOptions = {};
      if (sortBy === "stars") {
        orderOptions.stars = sortOrder === "desc" ? "desc" : "asc";
      } else {
        orderOptions.createdAt = "desc";
      }

      const [fetchedHotels, count] = await Promise.all([
        prisma.hotel.findMany({
          where: where,
          skip: skip,
          take: limitNumber,
          orderBy: orderOptions,
          select: this._hotelSelect(),
        }),
        prisma.hotel.count({ where: where }),
      ]);

      totalHotels = count;

      if (fetchedHotels.length > 0) {
        const hotelIds = fetchedHotels.map(h => h.id);
        const minPrices = await prisma.room.groupBy({
          by: ['hotelId'],
          where: { hotelId: { in: hotelIds }, ...roomConditions },
          _min: { price: true }
        });

        const minPriceMap = {};
        for (const mp of minPrices) {
          minPriceMap[mp.hotelId] = Number(mp._min.price);
        }

        hotels = fetchedHotels.map(h => ({
          ...h,
          startingPrice: minPriceMap[h.id] || null
        }));
      }
    }

    const formattedHotels = hotels.map(this._formatHotelResponse);

    return {
      results: formattedHotels.length,
      pagination: {
        totalRecords: totalHotels,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalHotels / limitNumber),
      },
      hotels: formattedHotels,
    };
  }

  static async getHotelById(id) {
    const hotel = await prisma.hotel.findUnique({
      where: { id, isActive: true },
      select: this._hotelSelect(),
    });

    if (!hotel) {
      throw new AppError("Hotel no encontrado", 404);
    }

    return this._formatHotelResponse(hotel);
  }

  static async createHotel(data, managerId) {
    const existingHotel = await prisma.hotel.findFirst({
      where: { name: data.name },
    });

    if (existingHotel) {
      throw new AppError(`Ya existe un hotel registrado con el nombre '${data.name}'`, 400);
    }

    const newHotel = await prisma.hotel.create({
      data: { ...data, managerId },
      select: this._hotelSelect(),
    });

    return this._formatHotelResponse(newHotel);
  }

  static async updateHotel(id, data, user) {
    const existsHotel = await prisma.hotel.findUnique({ where: { id, isActive: true } });
    if (!existsHotel) {
      throw new AppError("Hotel no encontrado", 404);
    }

    if (user.role === "MANAGER" && existsHotel.managerId !== user.id) {
      throw new AppError("No tienes permiso para realizar esta acción en este hotel", 403);
    }

    const hotel = await prisma.hotel.update({
      where: { id },
      data,
      select: this._hotelSelect(),
    });

    return this._formatHotelResponse(hotel);
  }

  static async deleteHotel(id, user) {
    const existsHotel = await prisma.hotel.findUnique({ where: { id, isActive: true } });
    if (!existsHotel) {
      throw new AppError("Hotel no encontrado", 404);
    }

    if (user.role === "MANAGER" && existsHotel.managerId !== user.id) {
      throw new AppError("No tienes permiso para realizar esta acción en este hotel", 403);
    }

    // Soft delete
    await prisma.hotel.update({
      where: { id },
      data: { isActive: false }
    });

    return { message: "Hotel eliminado con éxito" };
  }

  static _hotelSelect() {
    return {
      id: true,
      name: true,
      city: true,
      country: true,
      stars: true,
      description: true,
      imageUrls: true,
      manager: {
        select: { name: true, email: true },
      },
    };
  }

  static _formatHotelResponse(hotel) {
    return {
      ...hotel,
      managerName: hotel.manager.name,
      managerEmail: hotel.manager.email,
      manager: undefined,
    };
  }
}
