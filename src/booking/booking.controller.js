import { BookingService } from "../services/booking.service.js";

export const createBooking = async (req, res, next) => {
  try {
    const booking = await BookingService.createBooking(req.body, req.user.id);
    res.status(201).json({ message: "Reserva creada con éxito", booking });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const result = await BookingService.getBookings(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await BookingService.getBookingById(req.params.id, req.user);
    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const booking = await BookingService.updateBookingStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ message: "Reserva actualizada correctamente", booking });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    // Solo ADMIN (protegido por rutas)
    const result = await BookingService.deleteBooking(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
