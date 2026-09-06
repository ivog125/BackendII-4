import { registerUser, loginUser } from '../services/sessions.service.js';
import { config } from '../config/config.js';

export const getSessions = (req, res) => {
  res.status(200).json({
    status: 'success',
    payload: [],
  });
};

export const register = async (req, res) => {
  try {
    const newUser = await registerUser(req.body);
    res.status(201).json({ status: 'success', payload: newUser });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ status: 'error', message: error.message });
    } else {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
};

export const login = async (req, res) => {
  try {
    const token = await loginUser(req.body);

    res.cookie('currentUser', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600000,
      secure: config.nodeEnv === 'production',
    });

    res.status(200).json({ status: 'success', message: 'Login correcto' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};

export const current = (req, res) => {
  const { id, email, role } = req.user;

  res.status(200).json({ status: 'success', payload: { id, email, role } });
};

export const logout = (req, res) => {
  res.clearCookie('currentUser');

  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
