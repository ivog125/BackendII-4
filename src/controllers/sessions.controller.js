import { generateToken } from '../utils/jwt.js';
import { config } from '../config/config.js';

export const getSessions = (req, res) => {
  res.status(200).json({
    status: 'success',
    payload: [],
  });
};

export const register = (req, res) => {
  const { _id, first_name, last_name, email, role } = req.user;

  res.status(201).json({
    status: 'success',
    payload: { id: _id, first_name, last_name, email, role },
  });
};

export const login = (req, res) => {
  const token = generateToken({ id: req.user._id, email: req.user.email, role: req.user.role });

  res.cookie('currentUser', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 3600000,
    secure: config.nodeEnv === 'production',
  });

  res.status(200).json({ status: 'success', message: 'Login correcto' });
};

export const current = (req, res) => {
  const { id, email, role } = req.user;

  res.status(200).json({ status: 'success', payload: { id, email, role } });
};

export const logout = (req, res) => {
  res.clearCookie('currentUser');

  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
