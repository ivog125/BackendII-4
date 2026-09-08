import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/events.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, authorize('organizer', 'admin'), createEvent);
router.put('/:id', authMiddleware, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', authMiddleware, authorize('organizer', 'admin'), deleteEvent);

export default router;
