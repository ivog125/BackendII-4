import {
  createEvent,
  findAllEvents,
  findEventById,
  updateEventById,
  deleteEventById,
} from '../dao/events.dao.js';

export const create = (eventData) => createEvent(eventData);

export const findAll = () => findAllEvents();

export const findById = (id) => findEventById(id);

export const update = (id, updateData) => updateEventById(id, updateData);

export const deleteById = (id) => deleteEventById(id);
