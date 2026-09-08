import { create, findAll, findById, update, deleteById } from '../repositories/events.repository.js';

const assertOwnership = (event, user) => {
  if (user.role === 'admin') {
    return;
  }

  const userId = (user.id ?? user._id)?.toString();
  if (event.organizer.toString() !== userId) {
    const error = new Error('No podés modificar un evento que no te pertenece');
    error.statusCode = 403;
    throw error;
  }
};

export const createEventService = async (organizerId, eventData) => {
  const newEvent = await create({ ...eventData, organizer: organizerId });
  return newEvent;
};

export const listEventsService = async () => {
  const events = await findAll();
  return events;
};

export const getEventByIdService = async (eventId) => {
  const event = await findById(eventId);

  if (!event) {
    const error = new Error('Evento no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return event;
};

export const updateEventService = async (eventId, user, updateData) => {
  const event = await findById(eventId);

  if (!event) {
    const error = new Error('Evento no encontrado');
    error.statusCode = 404;
    throw error;
  }

  assertOwnership(event, user);

  const updatedEvent = await update(eventId, updateData);
  return updatedEvent;
};

export const deleteEventService = async (eventId, user) => {
  const event = await findById(eventId);

  if (!event) {
    const error = new Error('Evento no encontrado');
    error.statusCode = 404;
    throw error;
  }

  assertOwnership(event, user);

  const deletedEvent = await deleteById(eventId);
  return deletedEvent;
};
