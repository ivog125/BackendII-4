import User from '../models/User.js';

export const findUserByEmail = (email) => User.findOne({ email });

export const createUser = (userData) => User.create(userData);

export const findAllUsers = () => User.find({}, '-password');
