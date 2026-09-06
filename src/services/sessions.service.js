import { hashPassword, comparePassword } from '../utils/hash.js';
import { findByEmail, create } from '../repositories/users.repository.js';
import { generateToken } from '../utils/jwt.js';

const MIN_PASSWORD_LENGTH = 8;

export const registerUser = async ({ first_name, last_name, email, password }) => {
  // 0. Normalizar email
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  // 1. Validar campos obligatorios
  if (!first_name || !last_name || !normalizedEmail || !password) {
    const error = new Error('Faltan campos obligatorios');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validar formato de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error('Formato de email inválido');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validar longitud de contraseña
  if (password.length < MIN_PASSWORD_LENGTH) {
    const error = new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Verificar si el email ya está registrado
  const existingUser = await findByEmail(normalizedEmail);
  if (existingUser) {
    const error = new Error('El email ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  // 5. Hashear contraseña y crear usuario
  const hashedPassword = await hashPassword(password);

  const newUser = await create({
    first_name,
    last_name,
    email: normalizedEmail,
    password: hashedPassword,
  });

  // 6. Sanitizar respuesta: nunca exponer el password ni datos innecesarios
  return {
    id: newUser._id,
    first_name: newUser.first_name,
    last_name: newUser.last_name,
    email: newUser.email,
    role: newUser.role,
  };
};

export const loginUser = async ({ email, password }) => {
  // 1. Normalizar email
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  // 2. Validación básica
  if (!normalizedEmail || !password) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  // 3. Buscar usuario
  const user = await findByEmail(normalizedEmail);

  // 4. Verificar credenciales (mismo error genérico para no filtrar cuál falló)
  if (!user || !(await comparePassword(password, user.password))) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  // 5. Generar token
  const token = generateToken({ id: user._id, email: user.email, role: user.role });

  return token;
};