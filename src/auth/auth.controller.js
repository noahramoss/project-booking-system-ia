import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

const SALT_ROUNDS = 10;

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    //Verificamos si el usuario ya existe o se ha registrado con ese email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError("El email ya está en uso", 400));
    }

    //Hasheamos la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    //Creamos el nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    //Devolvemos los datos del usuario creado sin la contraseña
    res.status(201).json({
      message: "Usuario registrado con éxito",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //Buscamos el usuario para ver si existe en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user) {
      return next(new AppError("Credenciales inválidas", 401));
    }

    //Verificamos que la contraseña sea correcta
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return next(new AppError("Credenciales inválidas", 401));
    }

    //Generar token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    //Respuesta del login del usuario - aplanamos quitando passwordHash
    const { passwordHash: _, ...userData } = user;

    res.status(200).json({
      message: "Usuario logeado con éxito",
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};
