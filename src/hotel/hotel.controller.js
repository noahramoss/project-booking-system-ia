import { HotelService } from "../services/hotel.service.js";

export const createHotel = async (req, res, next) => {
  try {
    const hotel = await HotelService.createHotel(req.body, req.user.id);
    res.status(201).json({ message: "Hotel creado con éxito", hotel });
  } catch (error) {
    next(error);
  }
};

export const getAllHotels = async (req, res, next) => {
  try {
    const result = await HotelService.searchHotels(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (req, res, next) => {
  try {
    const hotel = await HotelService.getHotelById(req.params.id);
    res.status(200).json(hotel);
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req, res, next) => {
  try {
    const hotel = await HotelService.updateHotel(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Hotel actualizado", hotel });
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (req, res, next) => {
  try {
    const result = await HotelService.deleteHotel(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
