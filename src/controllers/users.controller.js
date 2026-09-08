import { listUsersService } from '../services/users.service.js';

export const getUsers = async (req, res) => {
  try {
    const users = await listUsersService();
    res.status(200).json({ status: 'success', payload: users });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: 'error', message: error.message });
  }
};
