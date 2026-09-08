import { findAll } from '../repositories/users.repository.js';

export const listUsersService = async () => {
  const users = await findAll();
  return users;
};
