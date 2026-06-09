import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export const createHotel = async (req, res, next) => {
  try {
    const { name, city, country, stars, description } = req.body;
    const manager = req.user.id;

    const existingHotel = await prisma.hotel.findFirst({
      where: { name: name },
    });

    if (existingHotel) {
      return next(
        new AppError(
          `Ya existe un hotel registrado con el nombre '${name}'`,
          400,
        ),
      );
    }

    const newHotel = await prisma.hotel.create({
      data: {
        ...req.body,
        managerId: manager,
      },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        stars: true,
        description: true,
        //Navegamos a la tabla de manager y sacamos su nombre
        manager: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedHotel = {
      ...newHotel,
      managerName: newHotel.manager.name,
      managerEmail: newHotel.manager.email,
      manager: undefined,
    };

    res.status(201).json({
      message: "Hotel creado con éxito",
      hotel: formattedHotel,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllHotels = async (req, res, next) => {
  try {
    const { 
      name, city, country, stars, 
      page = 1, limit = 10,
      checkIn, checkOut,
      capacity, minPrice, maxPrice,
      sortBy, sortOrder = "asc"
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    const where = {};

    if (name) where.name = { contains: name, mode: "insensitive" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (stars) where.stars = parseInt(stars);

    // Build room conditions for filtering hotels
    const roomConditions = {};

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
        return next(new AppError("Las fechas checkIn y checkOut deben tener un formato válido", 400));
      }
      if (checkInDate >= checkOutDate) {
        return next(new AppError("La fecha de checkOut debe ser posterior a la de checkIn", 400));
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

    // Apply room conditions to the hotel query if any exist
    if (Object.keys(roomConditions).length > 0) {
      where.rooms = {
        some: roomConditions
      };
    }

    let hotels = [];
    let totalHotels = 0;

    // Custom sorting by price (lowest room price first)
    if (sortBy === "price") {
      // 1. Fetch rooms matching conditions AND hotel filters, ordered by price
      const roomsWithHotelFilters = await prisma.room.findMany({
        where: {
          ...roomConditions,
          hotel: where
        },
        orderBy: { price: sortOrder === "desc" ? "desc" : "asc" },
        select: { hotelId: true, price: true },
      });

      // 2. Extract unique hotelIds maintaining order and track starting prices
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

      // 3. Fetch the actual hotels
      if (paginatedHotelIds.length > 0) {
        const fetchedHotels = await prisma.hotel.findMany({
          where: { id: { in: paginatedHotelIds } },
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            stars: true,
            description: true,
            manager: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        // 4. Sort fetched hotels according to paginatedHotelIds order and add startingPrice
        hotels = paginatedHotelIds.map(id => {
          const hotel = fetchedHotels.find(h => h.id === id);
          return {
            ...hotel,
            startingPrice: startingPrices[id]
          };
        });
      }
    } else {
      // Standard flow (sort by stars or default)
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
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            stars: true,
            description: true,
            manager: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.hotel.count({ where: where }),
      ]);

      totalHotels = count;

      // Add startingPrice to the standard flow as well
      if (fetchedHotels.length > 0) {
        const hotelIds = fetchedHotels.map(h => h.id);
        const minPrices = await prisma.room.groupBy({
          by: ['hotelId'],
          where: {
            hotelId: { in: hotelIds },
            ...roomConditions
          },
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

    const formattedHotels = hotels.map((hotel) => ({
      ...hotel,
      managerName: hotel.manager.name,
      managerEmail: hotel.manager.email,
      manager: undefined,
    }));

    res.status(200).json({
      results: formattedHotels.length,
      pagination: {
        totalRecords: totalHotels,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalHotels / limitNumber),
      },
      hotels: formattedHotels,
    });
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (req, res, next) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        stars: true,
        description: true,
        manager: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!hotel) {
      return next(new AppError("Hotel no encontrado", 404));
    }

    const formattedHotel = {
      ...hotel,
      managerName: hotel.manager.name,
      managerEmail: hotel.manager.email,
      manager: undefined,
    };

    res.status(200).json(formattedHotel);
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req, res, next) => {
  try {
    const id = req.params.id;

    const existsHotel = await prisma.hotel.findUnique({ where: { id } });
    if (!existsHotel) {
      return next(new AppError("Hotel no encontrado", 404));
    }

    // Validar autorización: Solo el dueño o un Admin pueden eliminar
    if (req.user.role === "MANAGER" && existsHotel.managerId !== req.user.id) {
      return next(
        new AppError(
          "No tienes permiso para realizar esta acción en este hotel",
          403,
        ),
      );
    }

    const hotel = await prisma.hotel.update({
      where: { id },
      data: { ...req.body },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        stars: true,
        description: true,
        manager: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedHotel = {
      ...hotel,
      managerName: hotel.manager.name,
      managerEmail: hotel.manager.email,
      manager: undefined,
    };

    res.status(200).json({
      message: "Hotel actualizado",
      hotel: formattedHotel,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteHotel = async (req, res, next) => {
  try {
    const id = req.params.id;

    const existsHotel = await prisma.hotel.findUnique({ where: { id } });
    if (!existsHotel) {
      return next(new AppError("Hotel no encontrado", 404));
    }

    // Validar autorización: Solo el dueño o un Admin pueden eliminar
    if (req.user.role === "MANAGER" && existsHotel.managerId !== req.user.id) {
      return next(
        new AppError(
          "No tienes permiso para realizar esta acción en este hotel",
          403,
        ),
      );
    }

    const hotel = await prisma.hotel.delete({
      where: { id },
    });
    res.status(200).json({ message: "Hotel eliminado con éxito" });
  } catch (error) {
    next(error);
  }
};
