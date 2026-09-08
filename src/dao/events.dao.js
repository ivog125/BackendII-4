import Event from '../models/Event.js';

export const createEvent = (eventData) => Event.create(eventData);

export const findAllEvents = () => Event.find();

export const findEventById = (id) => Event.findById(id);

export const updateEventById = (id, updateData) => Event.findByIdAndUpdate(id, updateData, { new: true });

export const deleteEventById = (id) => Event.findByIdAndDelete(id);
